import * as E from 'fp-ts/Either';
import * as F from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as ER from '@/infrastructure/core/Error';
import * as AM from '@/infrastructure/app_model';
import * as TF from '@tensorflow/tfjs-node';
import * as S from '@/infrastructure/app_model/options/sequential';
import * as IM from '@/infrastructure/core/IndexedMap';
import * as U from '@/infrastructure/utils/array';
import * as DS from '@/infrastructure/dataset';
import { applyTFLossFromAppLoss } from '../../loss';
import { applyAppModelOptimizer as applyTFOptimizerFromAppOptimizer } from '../../optimizer';
import moment from 'moment';
import { AppModelNormailzationData } from '../../AppModelNormalizationData';
import { readAppModelNormalization, writeAppModelNormalization } from '../../file';

/**
 * Create AppTFModel sequential simple from AppModel
 * @param appModel App model with sequential simple options
 */
export const createAppTFModelSequentialSimple = (appModel: AM.AppModel): E.Either<ER.AppError, AM.AppTFModel> =>
  F.pipe(
    appModel,
    E.fromNullable(ER.createAppError({ message: 'Model is null' })),
    E.map(x => x.options as S.AppModelOptionsSequentialSimple),
    E.fromNullable(ER.createAppError({ message: 'Bad options type' })),
    E.chain(
      E.map(options => {
        console.log(options.layers);
        const model = TF.sequential();

        // add input / hidden layers
        let inputShape = [appModel.inputsCount];
        for (const layer of options.layers) {
          model.add(TF.layers.dense({
            inputShape: inputShape,
            units: layer.units,
            useBias: layer.useBias,
            activation: layer.activation
          }));

          inputShape = [layer.units];
        }

        // add output
        model.add(TF.layers.dense({
          inputShape: inputShape,
          units: appModel.outputsCount,
          activation: options.output.activation,
        }));

        const modelArgs = F.pipe(
          {
            metrics: ['mse']
          } as TF.ModelCompileArgs,
          applyTFLossFromAppLoss(options.loss),
          applyTFOptimizerFromAppOptimizer(options.optimizer)
        );

        model.compile(modelArgs);
        return model;
      })
    )
  );

/**
 * AppTFModel of sequential simple
 * @param payload App model and dataset for training
 */
export const trainAppTFModelSequentialSimple = (payload: { model: AM.AppModel; dataset: DS.AppDataset; logCallback?: AM.AppTFTrainProcessLogCallback }) => (tfModel: AM.AppTFModel): TE.TaskEither<ER.AppError, TF.History> =>
  F.pipe(
    payload,
    E.fromNullable(ER.createAppError({ message: 'No arguments provided!' })),
    E.chain(p => {
      if (!p.dataset) return E.left(ER.createAppError({ message: 'Dataset not provided' }));
      if (!p.model) return E.left(ER.createAppError({ message: 'Model is not provided' }));
      if (!tfModel) return E.left(ER.createAppError({ message: 'TF model is not provided' }));
      return E.right({
        ...p,
        tf: tfModel
      });
    }),
    E.chain(x =>
      F.pipe(
        x.dataset,
        E.fromNullable(ER.createAppError({ message: 'Dataset is null' })),
        E.map(ds => {
          const options = x.model.options as S.AppModelOptionsSequentialSimple;
          return DS.appDatasetToTensors({
            normalize: options.normalizeDataset,
            shuffle: options.shuffleDataset
          })(ds);
        }),
        E.flatten,
        E.map(tensors => ({
          ...x,
          tensors: tensors,
          options: x.model.options as S.AppModelOptionsSequentialSimple
        }))
      )
    ),
    TE.fromEither,
    TE.chain(payload => /// write normalization file if required
      TE.tryCatch(
        async () => {
          const { tensors, model } = payload;
          if (tensors.isNormalized) {
            await F.pipe(
              {
                inputMax: tensors.inputMax,
                inputMin: tensors.inputMin,
                labelMax: tensors.labelMax,
                labelMin: tensors.labelMin
              } as AppModelNormailzationData,
              writeAppModelNormalization(model.id),
              TE.mapLeft(err => {
                throw err;
              })
            )();
          }

          return payload;
        },
        (reason) => ER.createAppError({ message: String(reason) })
      )),
    TE.chain(
      ({ tf, tensors, model, options }) =>
        TE.tryCatch(
          () => tf.fit(tensors.inputTensor, tensors.labelTensor!, {
            batchSize: options.batchSize ?? undefined,
            epochs: model.trainingEpochsLimit,
            shuffle: options.shuffleDataset,
            validationSplit: model.trainingSplit,
            callbacks: payload.logCallback as TF.CustomCallbackArgs
          }),
          (reason) => ER.createAppError({ message: String(reason) })
        )
    ),
  );

export const validateAppTFModelSequentialSimple = (payload: { model: AM.AppModel; dataset: DS.AppDataset; logCallback?: AM.AppTFTrainProcessLogCallback }) => (tfModel: AM.AppTFModel): TE.TaskEither<ER.AppError, AM.AppModelPredictionResult | unknown> =>
  F.pipe(
    payload,
    E.fromNullable(ER.createAppError({ message: 'Validation payload is null' })),
    E.chain(p => {
      if (!p.dataset) return E.left(ER.createAppError({ message: 'Dataset is null' }));
      if (!p.model) return E.left(ER.createAppError({ message: 'Model is null' }));
      if (!tfModel) return E.left(ER.createAppError({ message: 'TF model is null' }));
      return E.right({
        ...p,
        tf: tfModel
      });
    }),
    E.chain(data =>
      F.pipe(
        data.dataset,
        DS.appDatasetToTensors({ normalize: (data.model.options as S.AppModelOptionsSequentialSimple).normalizeDataset, shuffle: false }),
        E.fold(
          err => E.left(err),
          (tensors) => E.right({
            ...data,
            tensors,
            options: data.model.options as S.AppModelOptionsSequentialSimple
          })
        )
      )
    ),
    TE.fromEither,
    TE.chain(payload => {
      const { options, model } = payload;
      if (options.normalizeDataset) {
        F.pipe(
          model.id,
          readAppModelNormalization,
          TE.map(nData => {
            nData
          })
        )()
      }

      return TE.right(payload);
    }),
    TE.chain(({ tf, tensors, dataset, model }) =>
      TE.tryCatch(
        async () => {
          const [xs, preds] = TF.tidy(() => {
            let preds = tf.predict(tensors.inputTensor.reshape([tensors.size, tensors.inputRank])) as TF.Tensor;
            let xs: TF.Tensor = tensors.inputTensor;
            if (tensors.isNormalized) {
              preds = DS.unNormalizeTensor(preds, tensors.labelMin!, tensors.labelMax!);
              xs = DS.unNormalizeTensor(xs, tensors.inputMin!, tensors.inputMax!);
            }

            return [xs.dataSync(), preds.dataSync()];
          });


          // const
          //   inputs = U.arrayChunk([...xs], model.inputsCount),
          //   outputs = U.arrayChunk([...preds], model.outputsCount);

          // let corrects;
          // if (tensors.labelTensor) {
          //   let correctUnNormal = tensors.labelTensor.dataSync();
          //   corrects = tensors.isNormalized ? DS.unNormalizeTensor(correctUnNormal as, tensors.labelMin!, tensors.labelMax!) : correctUnNormal;
          // }
          // corrects = tensors.inputTensor
          //   ? U.arrayChunk([tensors.])


          // let chunkedOutputs = [];
          const correctResults = null;
          const ys = tensors.labelTensor?.dataSync();
          if (ys) {
            // correctResults = AM.chunk([...ys], 1);
          }

          return null;
          // return {
          //   createdTime: moment().unix(),
          //   datasetId: dataset.id,
          //   correctData: tensors?.labelTensor?.dataSync(),
          //   datasetName: '',
          //   id: '',
          //   inputData: [],
          // } as AM.AppModelPredictionResult;
        },
        (reason) => ER.createAppError({ message: String(reason) })
      ))
  );