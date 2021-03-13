import * as tf from '@tensorflow/tfjs-node';
import { KeyLabelStringIterable } from '@/infrastructure/core';

export type AppModelOptimizer = 'ADAM' | 'SGD';

export const AppModelOptimizerToString = (optimizer: AppModelOptimizer): string => {
  switch (optimizer) {
    case 'ADAM':
      return 'Adam';
    case 'SGD':
      return 'sgd';
    default:
      return '';
  }
};

export const AppModelOptimizersList = (): KeyLabelStringIterable<AppModelOptimizer>[] => [
  {
    key: 'ADAM',
    label: AppModelOptimizerToString('ADAM')
  },
  {
    key: 'SGD',
    label: AppModelOptimizerToString('SGD')
  }
];

export const applyAppModelOptimizer = (optimizer: AppModelOptimizer, learningRate: number) => (args: tf.ModelCompileArgs): tf.ModelCompileArgs => {
  switch (optimizer) {
    case 'ADAM':
      args.optimizer = tf.train.adam(learningRate);
      break;
    case 'SGD':
      args.optimizer = tf.train.sgd(learningRate);
      break;
    default:
      break;
  }

  return args;
};
