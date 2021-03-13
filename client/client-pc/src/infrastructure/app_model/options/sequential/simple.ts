import { AppActivationType } from '../../activation';
import * as E from 'fp-ts/Either';
import * as F from 'fp-ts/function';
import { AppError, createAppError } from '@/infrastructure/core';
import { AppModelOptimizer } from '../../optimizer';
import { AppModelLoss } from '../../loss';

export interface AppModelOptionsSequentialSimple {
  type: 'SEQUENTIAL_SIMPLE';
  learningRate: number;
  batchSize: number | null;
  shuffleDataset: boolean;
  normalizeDataset: boolean;
  optimizer: AppModelOptimizer;
  loss: AppModelLoss;
  layers: AppModelOptionsSequentialSimpleLayer[];
  output: {
    useBias: boolean;
    activation: AppActivationType;
  };
}

export interface AppModelOptionsSequentialSimpleLayer {
  useBias: boolean;
  units: number;
  activation: AppActivationType;
}

export const defaultAppModelOptionsSequentialSimpleLayer = (): AppModelOptionsSequentialSimpleLayer => ({
  activation: 'relu',
  units: 50,
  useBias: true
});

export const defaultAppModelOptionsSequentialSimple = (): AppModelOptionsSequentialSimple => ({
  type: 'SEQUENTIAL_SIMPLE',
  learningRate: 0.1,
  batchSize: null,
  normalizeDataset: true,
  optimizer: 'ADAM',
  shuffleDataset: true,
  loss: 'MeanSquaredError',
  layers: [
    defaultAppModelOptionsSequentialSimpleLayer()
  ],
  output: {
    activation: 'linear',
    useBias: false
  }
});

export const validateAppModelOptionsSequentialSimple = (options: AppModelOptionsSequentialSimple): E.Either<AppError, unknown> => {
  const vLearningRate = (o: AppModelOptionsSequentialSimple): E.Either<AppError, AppModelOptionsSequentialSimple> => o.learningRate >= 1 || o.learningRate <= 0 ? E.left(createAppError({ message: 'Learning rate must be 0 < X < 1.' })) : E.right(o);
  const vLayersUnits = (o: AppModelOptionsSequentialSimple): E.Either<AppError, AppModelOptionsSequentialSimple> => o.layers.some(x => x.units <= 0 || x.units >= 100000) ? E.left(createAppError({ message: 'Units per layer limited 0 < X < 100 000' })) : E.right(o);

  return F.pipe(
    options,
    E.fromNullable(createAppError({ message: 'Options is null' })),
    E.chain(vLearningRate),
    E.chain(vLayersUnits)
  );
};
