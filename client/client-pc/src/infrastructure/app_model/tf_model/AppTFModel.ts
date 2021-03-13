import { AppModel } from './../AppModel';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import * as F from 'fp-ts/function';
import { AppError, createAppError } from '@/infrastructure/core';
import * as tf from '@tensorflow/tfjs-node';
import { EnumAppModelType } from './../enum';
import * as SEQUENTIAL from './sequential';
import { AppDataset, AppDatasetTensors, appDatasetToTensors, appModelToTensorOptions } from '@/infrastructure/dataset';
import { AppModelPredictionResult } from '../AppModelPrediction';
import { getAppDI } from '@/di/AppDI';

const tensorNormalizeRepository = () =>
  getAppDI().tensorNormalizationRepository;

export type AppTFModel = tf.Sequential;

export type AppTFModelTrainingDelegate = (
  tfModel: AppTFModel
) => TE.TaskEither<AppError, tf.History>;

export interface AppTFTrainProcessLogCallback {
  onEpochEnd?: (epoch: number, log: tf.Logs) => void | Promise<void>;
  onBatchEnd?: (epoch: number, log: tf.Logs) => void | Promise<void>;
  onTrainEnd?: (log: tf.Logs) => void | Promise<void>;
}

export const createAppTFModelFromModel = (
  payload: AppModel
): E.Either<AppError, AppTFModel> => {
  switch (payload.type) {
    case EnumAppModelType.sequential:
      return SEQUENTIAL.createAppTFModelSequential(payload);
    default:
      return E.left(createAppError({ message: 'Not acceptable' }));
  }
};

export const createAppTFModelName = (payload: AppModel): string => {
  switch (payload.type) {
    case EnumAppModelType.sequential:
      return SEQUENTIAL.createNameAppTFModelSequential(payload);
    default:
      return 'NOT IMPLEMENTED';
  }
};

export const trainAppTFModel = (payload: {
  tensors: AppDatasetTensors;
  model: AppModel;
  logCallback?: AppTFTrainProcessLogCallback;
}): AppTFModelTrainingDelegate => {
  switch (payload.model.type) {
    case EnumAppModelType.sequential:
      return SEQUENTIAL.trainAppTFModelSequential(payload);
    default:
      throw 'Impossible error';
  }
};

export const validateAppTFModel = (payload: {
  dataset: AppDataset;
  model: AppModel;
  logCallback?: AppTFTrainProcessLogCallback;
}) => (
  tf: AppTFModel
): TE.TaskEither<AppError, AppModelPredictionResult> => {
  return F.pipe(
    payload.model,
    E.fromNullable(createAppError({ message: 'Model is null' })),
    TE.fromEither,
    TE.chain(model => {
      const options = appModelToTensorOptions(model, false);
      if (options.normalize) {
        return F.pipe(
          tensorNormalizeRepository().read(payload.model.id),
        );
      }

      return TE.right(undefined);
    }),
    TE.chain(normData =>
      F.pipe(
        payload.dataset,
        appDatasetToTensors(appModelToTensorOptions(payload.model, false), normData),
        TE.fromEither
      )
    ),
    TE.chain(tensors => {
      switch (payload.model.type) {
        case EnumAppModelType.sequential:
          return SEQUENTIAL.validateAppTFModelSequential({
            ...payload,
            tensors: tensors
          })(tf);
        default:
          return TE.left(
            createAppError({
              message: 'Can not process model type: ' + payload.model.type
            })
          );
      }
    })
  );
};
