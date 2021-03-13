import { AppError, createAppError } from '@/infrastructure/core';
import { EnumAppModelSubtype, EnumAppModelType } from '..';
import * as E from 'fp-ts/Either';
import { AppModelOptionsSequentialLSTM, AppModelOptionsSequentialSimple, defaultAppModelOptionsSequentialLSTM, defaultAppModelOptionsSequentialSimple, validateAppModelOptionsSequentialLSTM, validateAppModelOptionsSequentialSimple } from './sequential';

export type AppModelSequentialOptions = AppModelOptionsSequentialLSTM | AppModelOptionsSequentialSimple;

export type AppModelOptions = AppModelSequentialOptions;

export const validateAppModelOptions = (options: AppModelOptions): E.Either<AppError, unknown> => {
  switch (options.type) {
    case 'SEQUENTIAL_SIMPLE':
      return validateAppModelOptionsSequentialSimple(options);
    case 'SEQUENTIAL_LSTM':
      return validateAppModelOptionsSequentialLSTM(options);
    default:
      return E.left(createAppError({ message: `Type ${(options as AppModelOptions).type} is not supported yet.` }));
  }
};

export const appModelOptionsSelect = (payload: { type: EnumAppModelType; subtype: EnumAppModelSubtype }): AppModelOptions => {
  if (payload.type == EnumAppModelType.sequential) {
    if (payload.subtype == EnumAppModelSubtype.simple) {
      return defaultAppModelOptionsSequentialSimple();
    }

    if (payload.subtype == EnumAppModelSubtype.lstm) {
      return defaultAppModelOptionsSequentialLSTM();
    }
  }

  throw 'Wrong type / subtype combination';
};