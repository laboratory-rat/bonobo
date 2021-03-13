import { AppError, createAppError } from '@/infrastructure/core';
import { AppActivationType } from '@/infrastructure/app_model/activation';
import * as E from 'fp-ts/Either';
import * as F from 'fp-ts/function';

export interface AppModelOptionsSequentialLSTM {
  type: 'SEQUENTIAL_LSTM';
  learningRate: number;
  batchSize: number | null;
  layers: AppModelOptionsSequentialLSTMLayer[];
  output: {
    useBias: boolean;
    activation?: AppActivationType;
  };
}

export interface AppModelOptionsSequentialLSTMLayer {
  useBias: boolean;
  units: number[];
  activation: AppActivationType;
}

export const defaultAppModelOptionsSequentialLSTMLayer = (): AppModelOptionsSequentialLSTMLayer => ({
  activation: 'relu',
  units: [50],
  useBias: true
});


export const defaultAppModelOptionsSequentialLSTM = (): AppModelOptionsSequentialLSTM => ({
  type: 'SEQUENTIAL_LSTM',
  learningRate: 0.1,
  batchSize: null,
  output: {
    useBias: false,
    activation: 'relu'
  },
  layers: [
    defaultAppModelOptionsSequentialLSTMLayer(),
  ],
});

export const validateAppModelOptionsSequentialLSTM = (options: AppModelOptionsSequentialLSTM): E.Either<AppError, unknown> => {
  const vLearningRate = (o: AppModelOptionsSequentialLSTM): E.Either<AppError, AppModelOptionsSequentialLSTM> => o.learningRate >= 1 || o.learningRate <= 0 ? E.left(createAppError({ message: 'Learning rate must be 0 < X < 1.' })) : E.right(o);
  const vLayersUnits = (o: AppModelOptionsSequentialLSTM): E.Either<AppError, AppModelOptionsSequentialLSTM> => o.layers.some(x => x.units.some(z => z <= 0) || x.units.some(z => z > 100000)) ? E.left(createAppError({ message: 'Units per layer limited 0 < X < 100 000' })) : E.right(o);

  return F.pipe(
    options,
    E.fromNullable(createAppError({ message: 'Options is null' })),
    E.chain(vLearningRate),
    E.chain(vLayersUnits)
  );
};