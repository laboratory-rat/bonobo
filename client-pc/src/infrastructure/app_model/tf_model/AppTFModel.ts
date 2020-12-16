import { AppModel } from './../AppModel';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { AppError, createAppError } from '@/infrastructure/core';
import * as tf from '@tensorflow/tfjs-node';
import { EnumAppModelType } from './../enum';
import * as SEQUENTIAL from './sequential';
import { AppDataset } from '@/infrastructure/dataset';
import { AppModelPredictionResult } from '../AppModelPrediction';

export type AppTFModel = tf.Sequential;

export type AppTFModelTrainingDelegate = (tfModel: AppTFModel) => TE.TaskEither<AppError, tf.History>;

export interface AppTFTrainProcessLogCallback {
  onEpochEnd?: (epoch: number, log: tf.Logs) => void | Promise<void>;
  onBatchEnd?: (epoch: number, log: tf.Logs) => void | Promise<void>;
  onTrainEnd?: (log: tf.Logs) => void | Promise<void>;
}

export const createAppTFModelFromModel = (payload: AppModel): E.Either<AppError, AppTFModel> => {
  switch (payload.type) {
    case EnumAppModelType.sequential:
      return SEQUENTIAL.createAppTFModelSequential(payload);
    default:
      return E.left(createAppError({ message: 'Not acceptable' }));
  }
};

export const trainAppTFModel = (payload: { dataset: AppDataset; model: AppModel; logCallback?: AppTFTrainProcessLogCallback }): AppTFModelTrainingDelegate => {
  switch (payload.model.type) {
    case EnumAppModelType.sequential:
      return SEQUENTIAL.trainAppTFModelSequential(payload);
    default:
      throw 'Impossible error';
  }
};

export const validateAppTFModel = (payload: { dataset: AppDataset; model: AppModel; logCallback?: AppTFTrainProcessLogCallback }) => (tf: AppTFModel): TE.TaskEither<AppError, AppModelPredictionResult | unknown> => {
  switch (payload.model.type) {
    case EnumAppModelType.sequential:
      return SEQUENTIAL.validateAppTFModelSequential(payload)(tf);
    default:
      throw 'Impossible error';
  }
};