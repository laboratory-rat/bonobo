import * as AM from '@/infrastructure/app_model';
import { AppModel, EnumAppModelSubtype } from '@/infrastructure/app_model';
import * as E from 'fp-ts/Either';
import * as ER from '@/infrastructure/core/Error';
import * as SS from './simple';
import * as TE from 'fp-ts/TaskEither';
import { AppDatasetTensors } from '@/infrastructure/dataset';
import { getAppDI } from '@/di/AppDI';

const normalizationTensorsRepository = () => getAppDI().tensorNormalizationRepository;

export const createAppTFModelSequential = (payload: AM.AppModel): E.Either<ER.AppError, AM.AppTFModel> => {
  switch (payload.subtype) {
    case AM.EnumAppModelSubtype.simple:
      return SS.createAppTFModelSequentialSimple(payload);
    default:
      return E.left(ER.createAppError({ message: 'Not acceptable' }));
  }
};

export const trainAppTFModelSequential = (payload: { tensors: AppDatasetTensors; model: AM.AppModel; logCallback?: AM.AppTFTrainProcessLogCallback }): AM.AppTFModelTrainingDelegate => {
  switch (payload.model.subtype) {
    case AM.EnumAppModelSubtype.simple:
      return SS.trainAppTFModelSequentialSimple(payload);
    default:
      throw 'Impossible error';
  }
};

export const validateAppTFModelSequential = (payload: { tensors: AppDatasetTensors; model: AM.AppModel; logCallback?: AM.AppTFTrainProcessLogCallback }) => (tf: AM.AppTFModel): TE.TaskEither<ER.AppError, AM.AppModelPredictionResult> => {
  switch (payload.model.subtype) {
    case AM.EnumAppModelSubtype.simple:
      return SS.validateAppTFModelSequentialSimple(payload)(tf);
    default:
      throw 'Impossible error';
  }
};

export const createNameAppTFModelSequential = (model: AppModel): string => {
  switch (model.subtype) {
    case EnumAppModelSubtype.simple:
      return SS.createNameAppTFModelSequentialSimple(model);
    default:
      return 'Not implemented';
  }
};