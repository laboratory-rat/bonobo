import * as tf from '@tensorflow/tfjs-node';
import { KeyLabelStringIterable } from '../core';

export type AppModelLoss = 'MeanSquaredError';

export const appModelLossToString = (loss: AppModelLoss): string => {
  switch (loss) {
    case 'MeanSquaredError':
      return 'Mean squared error';
    default:
      return '';
  }
};

export const appModelLossTypesList = (): KeyLabelStringIterable<AppModelLoss>[] => [
  {
    key: 'MeanSquaredError',
    label: appModelLossToString('MeanSquaredError')
  }
];

export const applyTFLossFromAppLoss = (loss: AppModelLoss) => (args: tf.ModelCompileArgs): tf.ModelCompileArgs => {
  switch (loss) {
    case 'MeanSquaredError':
      args.loss = tf.losses.meanSquaredError;
      break;
    default:
      break;
  }

  return args;
};
