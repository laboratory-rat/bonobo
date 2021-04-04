import * as tf from '@tensorflow/tfjs-node';
import { KeyLabelStringIterable } from '../core';

export type AppModelLoss = 'MeanSquaredError' | 'AbsoluteDifference' | 'ComputeWeightedLoss' | 'HingeLoss' | 'HuberLoss' | 'SigmoidCrossEntropy' | 'SoftMaxCrossEntropy';

export const appModelLossToString = (loss: AppModelLoss): string => {
  switch (loss) {
    case 'MeanSquaredError':
      return 'Mean squared error';
    case 'AbsoluteDifference':
      return 'Absolute difference';
    case 'ComputeWeightedLoss':
      return 'Compute weighted loss';
    case 'HingeLoss':
      return 'Hinge loss';
    case 'HuberLoss':
      return 'Huber loss';
    case 'SigmoidCrossEntropy':
      return 'Sigmoid cross entropy';
    case 'SoftMaxCrossEntropy':
      return 'Soft max cross entropy';
    default:
      return '';
  }
};

export const appModelLossTypesList = (): KeyLabelStringIterable<AppModelLoss>[] => [
  {
    key: 'MeanSquaredError',
    label: appModelLossToString('MeanSquaredError')
  },
  {
    key: 'AbsoluteDifference',
    label: appModelLossToString('AbsoluteDifference')
  },
  {
    key: 'ComputeWeightedLoss',
    label: appModelLossToString('ComputeWeightedLoss')
  },
  {
    key: 'HingeLoss',
    label: appModelLossToString('HingeLoss')
  },
  {
    key: 'HuberLoss',
    label: appModelLossToString('HuberLoss')
  },
  {
    key: 'SigmoidCrossEntropy',
    label: appModelLossToString('SigmoidCrossEntropy')
  },
  {
    key: 'SoftMaxCrossEntropy',
    label: appModelLossToString('SoftMaxCrossEntropy')
  },
];

export const applyTFLossFromAppLoss = (loss: AppModelLoss) => (args: tf.ModelCompileArgs): tf.ModelCompileArgs => {
  switch (loss) {
    case 'MeanSquaredError':
      args.loss = tf.losses.meanSquaredError;
      break;
    case 'AbsoluteDifference':
      args.loss = tf.losses.absoluteDifference;
      break;
    case 'ComputeWeightedLoss':
      args.loss = tf.losses.computeWeightedLoss;
      break;
    case 'HingeLoss':
      args.loss = tf.losses.hingeLoss;
      break;
    case 'HuberLoss':
      args.loss = tf.losses.huberLoss;
      break;
    case 'SigmoidCrossEntropy':
      args.loss = tf.losses.sigmoidCrossEntropy;
      break;
    case 'SoftMaxCrossEntropy':
      args.loss = tf.losses.softmaxCrossEntropy;
      break;
    default:
      args.loss = tf.losses.absoluteDifference;
      break;
  }

  return args;
};
