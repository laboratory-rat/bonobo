import * as AM from '@/infrastructure/app_model';
import * as AD from '@/infrastructure/dataset';
import * as E from 'fp-ts/Either';
import * as ER from '@/infrastructure/core/Error';
import * as SS from './simple';
import * as TE from 'fp-ts/TaskEither';

export const createAppTFModelSequential = (payload: AM.AppModel): E.Either<ER.AppError, AM.AppTFModel> => {
  switch (payload.subtype) {
    case AM.EnumAppModelSubtype.simple:
      return SS.createAppTFModelSequentialSimple(payload);
    default:
      return E.left(ER.createAppError({ message: 'Not acceptable' }));
  }
};

export const trainAppTFModelSequential = (payload: { dataset: AD.AppDataset; model: AM.AppModel; logCallback?: AM.AppTFTrainProcessLogCallback }): AM.AppTFModelTrainingDelegate => {
  switch (payload.model.subtype) {
    case AM.EnumAppModelSubtype.simple:
      return SS.trainAppTFModelSequentialSimple(payload);
    default:
      throw 'Impossible error';
  }
};

export const validateAppTFModelSequential = (payload: { dataset: AD.AppDataset; model: AM.AppModel; logCallback?: AM.AppTFTrainProcessLogCallback }) => (tf: AM.AppTFModel): TE.TaskEither<ER.AppError, AM.AppModelPredictionResult | unknown> => {
  switch (payload.model.subtype) {
    case AM.EnumAppModelSubtype.simple:
      return SS.validateAppTFModelSequentialSimple(payload)(tf);
    default:
      throw 'Impossible error';
  }
};