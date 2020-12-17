import * as tf from '@tensorflow/tfjs-node';
import { KeyLabelStringIterable } from '@/infrastructure/core';

export type AppModelOptimizer = 'ADAM';

export const AppModelOptimizerToString = (optimizer: AppModelOptimizer): string => {
  switch (optimizer) {
    case 'ADAM':
      return 'Adam';
    default:
      return '';
  }
};

export const AppModelOptimizersList = (): KeyLabelStringIterable<AppModelOptimizer>[] => [
  {
    key: 'ADAM',
    label: AppModelOptimizerToString('ADAM')
  }
];

export const applyAppModelOptimizer = (optimizer: AppModelOptimizer) => (args: tf.ModelCompileArgs): tf.ModelCompileArgs => {
  switch (optimizer) {
    case 'ADAM':
      args.optimizer = tf.train.adam();
      break;
    default:
      break;
  }

  return args;
};
