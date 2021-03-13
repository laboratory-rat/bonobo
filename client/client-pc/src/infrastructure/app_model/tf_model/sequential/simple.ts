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
import {
  readAppModelNormalization,
  writeAppModelNormalization
} from '../../file';
import { AppDatasetTensors, tensorTo2DMatrix } from '@/infrastructure/dataset';
import { AppModelOptionsSequentialSimple } from '@/infrastructure/app_model/options/sequential';
import { createAppError } from '@/infrastructure/core/Error';
import { generageId } from '@/infrastructure/core';
import { AppModel, activationTypeToTFActivation } from '@/infrastructure/app_model';

/**
 * Create AppTFModel sequential simple from AppModel
 * @param appModel App model with sequential simple options
 */
export const createAppTFModelSequentialSimple = (
  appModel: AM.AppModel
): E.Either<ER.AppError, AM.AppTFModel> =>
  F.pipe(
    appModel,
    E.fromNullable(ER.createAppError({ message: 'Model is null' })),
    E.map(x => x.options as S.AppModelOptionsSequentialSimple),
    E.fromNullable(ER.createAppError({ message: 'Bad options type' })),
    E.chain(
      E.map(options => {
        const model = TF.sequential();
        const inputShape = [appModel.inputsCount];

        // add input
        model.add(TF.layers.inputLayer({
          inputShape: inputShape
        }));

        // add input / hidden layers
        for (const layer of options.layers) {
          model.add(
            TF.layers.dense({
              // inputShape: inputShape,
              units: layer.units,
              useBias: layer.useBias,
              activation: activationTypeToTFActivation(layer.activation)
            })
          );

          // inputShape = [layer.units, 1];
        }

        // add output
        model.add(TF.layers.dense({
          // inputShape: inputShape,
          units: appModel.outputsCount,
          activation: activationTypeToTFActivation(options.output.activation)
        }));

        const modelArgs = F.pipe(
          {
            metrics: ['mse', 'accuracy']
          } as TF.ModelCompileArgs,
          applyTFLossFromAppLoss(options.loss),
          applyTFOptimizerFromAppOptimizer(
            options.optimizer,
            options.learningRate
          )
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
export const trainAppTFModelSequentialSimple = (payload: {
  model: AM.AppModel;
  tensors: AppDatasetTensors;
  logCallback?: AM.AppTFTrainProcessLogCallback;
}) => (tfModel: AM.AppTFModel): TE.TaskEither<ER.AppError, TF.History> =>
  F.pipe(
    payload,
    E.fromNullable(ER.createAppError({ message: 'No arguments provided!' })),
    E.chain(p => {
      if (!p.tensors)
        return E.left(ER.createAppError({ message: 'Tensors not provided' }));
      if (!p.model)
        return E.left(ER.createAppError({ message: 'Model is not provided' }));
      if (!tfModel)
        return E.left(
          ER.createAppError({ message: 'TF model is not provided' })
        );
      return E.right({
        ...p,
        tf: tfModel,
        options: p.model.options as S.AppModelOptionsSequentialSimple
      });
    }),
    TE.fromEither,
    TE.chain((
      payload /// write normalization file if required
    ) =>
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
        reason => ER.createAppError({ message: String(reason) })
      )
    ),
    TE.chain(({ tf, tensors, model, options }) =>
      TE.tryCatch(
        () =>
          tf.fit(tensors.inputTensor, tensors.labelTensor!, {
            batchSize: options.batchSize ?? undefined,
            epochs: model.trainingEpochsLimit,
            shuffle: options.shuffleDataset,
            validationSplit: model.trainingSplit,
            callbacks: [
              // TF.callbacks.earlyStopping({
              //   monitor: 'val_mse',
              //   mode: 'min',
              //   minDelta: 0.0001,
              //   patience: 25
              // }),
              new TF.CustomCallback(
                payload.logCallback as TF.CustomCallbackArgs
              )
            ]
          }),
        reason => ER.createAppError({ message: String(reason) })
      )
    )
  );

export const validateAppTFModelSequentialSimple = (payload: {
  model: AM.AppModel;
  tensors: AppDatasetTensors;
  logCallback?: AM.AppTFTrainProcessLogCallback;
}) => (
  tfModel: AM.AppTFModel
): TE.TaskEither<ER.AppError, AM.AppModelPredictionResult> =>
  F.pipe(
    payload,
    E.fromNullable(
      ER.createAppError({ message: 'Validation payload is null' })
    ),
    E.chain(p => {
      if (!p.tensors)
        return E.left(ER.createAppError({ message: 'Tensors is null' }));
      if (!p.model)
        return E.left(ER.createAppError({ message: 'Model is null' }));
      if (!tfModel)
        return E.left(ER.createAppError({ message: 'TF model is null' }));
      return E.right({
        ...p,
        tf: tfModel
      });
    }),
    TE.fromEither,
    TE.chain(({ tf, tensors, model }) =>
      TE.tryCatch(
        async () => {
          const start = moment().unix();
          const [xs, preds, correct] = TF.tidy(() => {
            let preds = tf.predict(
              tensors.inputTensor.reshape([tensors.size, tensors.inputRank])
            ) as TF.Tensor;
            let xs: TF.Tensor = tensors.inputTensor;
            let correct: TF.Tensor = tensors.labelTensor!;
            if (tensors.isNormalized) {
              preds = DS.unNormalizeTensor(
                preds,
                tensors.labelMin!,
                tensors.labelMax!
              );
              xs = DS.unNormalizeTensor(
                xs,
                tensors.inputMin!,
                tensors.inputMax!
              );
              correct = DS.unNormalizeTensor(
                correct,
                tensors.labelMin!,
                tensors.labelMax!
              );
            }

            return [xs, preds, correct];
          });

          return {
            createdTime: moment().unix(),
            finishedTime: moment().unix(),
            datasetId: model.datasetId,
            datasetName: '',
            id: generageId(8),
            inputLabels: [],
            outputLabels: [],
            isValidation: true,
            correctData: tensorTo2DMatrix(correct),
            inputData: tensorTo2DMatrix(xs),
            modelId: model.id,
            modelName: model.name,
            outputData: tensorTo2DMatrix(preds),
            startedTime: start
          } as AM.AppModelPredictionResult;
        },
        reason => ER.createAppError({ message: String(reason) })
      )
    )
  );

/**
 * Create auto naming for model
 * @param model
 */
export const createNameAppTFModelSequentialSimple = (
  model: AppModel
): string => {
  const options = model.options as AppModelOptionsSequentialSimple;
  const s = [];
  options.normalizeDataset && s.push('NORM');
  options.shuffleDataset && s.push('SHUFFLE');
  options.batchSize &&
    options.batchSize > 0 &&
    s.push(`BATCH-${options.batchSize}`);
  options.learningRate && s.push(`LR-${options.learningRate}`);
  options.loss && s.push(`LOSS-${options.loss}`);
  options.optimizer && s.push(`OPTIMIZER-${options.optimizer}`);
  if (options.layers && options.layers.length) {
    options.layers.forEach(layer => {
      const ls = [];
      layer.units && layer.units > 0 && ls.push(layer.units);
      layer.activation && ls.push(layer.activation);
      layer.useBias && ls.push('BIAS');
      s.push(`(${ls.join('_')})`);
    });
  }

  if (options.output) {
    const os = [];
    options.output.activation && os.push(options.output.activation);
    options.output.useBias && os.push('BIAS');
    s.push(`[${os.join('_')}]`);
  }

  return s.join('_');
};
