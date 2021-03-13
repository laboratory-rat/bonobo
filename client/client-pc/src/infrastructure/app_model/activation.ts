/**
 * @packageDocumentation AppModel
 */

import { KeyLabelStringIterable } from '../core';

export type AppNonNullActivationType =
  | 'elu'
  | 'selu'
  | 'relu'
  | 'relu6'
  | 'linear'
  | 'sigmoid'
  | 'hardSigmoid'
  | 'softplus'
  | 'softsign'
  | 'tanh'
  | 'softmax';

/**
 * Available activation types
 *
 * @enum
 */
export type AppActivationType =
  | AppNonNullActivationType
  | 'none';

export const activationTypeToTFActivation = (
  t: AppActivationType
): AppNonNullActivationType | undefined => (t == 'none' ? undefined : t);

/**
 * Activation types list easy to display
 */
export const appActivationTypesList: KeyLabelStringIterable<
  AppActivationType
>[] = [
  {
    key: 'elu',
    label: 'elu'
  },
  {
    key: 'hardSigmoid',
    label: 'hardSigmoid'
  },
  {
    key: 'linear',
    label: 'linear'
  },
  {
    key: 'relu',
    label: 'relu'
  },
  {
    key: 'relu6',
    label: 'relu6'
  },
  {
    key: 'selu',
    label: 'selu'
  },
  {
    key: 'sigmoid',
    label: 'sigmoid'
  },
  {
    key: 'softmax',
    label: 'softmax'
  },
  {
    key: 'softplus',
    label: 'softplus'
  },
  {
    key: 'softsign',
    label: 'softsign'
  },
  {
    key: 'tanh',
    label: 'tanh'
  },
  {
    key: 'none',
    label: 'none'
  }
];
