/**
 * @packageDocumentation AppModel
 */

import TF from '@tensorflow/tfjs';

/**
 * Normalization info for TF.model instance.
 * Use it no normalize / unnormalize input/label tensolrs.
 * Optional for model.
 * 
 * @interface
 */
export interface AppModelNormailzationData {
  /** Input tensor max data */
  inputMax: TF.Tensor;

  /** Input tensor min data */
  inputMin: TF.Tensor;

  /** Label tensor max data */
  labelMax: TF.Tensor;

  /** Label tensor min data */
  labelMin: TF.Tensor;
}