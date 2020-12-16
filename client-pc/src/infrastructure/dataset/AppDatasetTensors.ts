/**
 * Dataset tools package
 * 
 * @packageDocumentation
 * @module AppDataset
 */

import * as TF from '@tensorflow/tfjs';
import * as E from 'fp-ts/Either';
import * as F from 'fp-ts/function';
import * as DS from './';
import * as ERR from '@/infrastructure/core/Error';
import * as IM from '@/infrastructure/core/IndexedMap';

/**
 * Dataset tensors represintation
 */
export interface AppDatasetTensors extends TF.TensorContainerObject {
  /** How long the tensors are */
  size: number;

  /** Input data as tensor */
  inputTensor: TF.Tensor2D;

  /** Label (output) data as tensor if any */
  labelTensor?: TF.Tensor2D;

  /** Is data normalized */
  isNormalized: boolean;

  /** Normalized input max metadata */
  inputMax?: TF.Tensor2D;

  /** Normalized input min metadata */
  inputMin?: TF.Tensor2D;

  /** Normalized label max metadata */
  labelMax?: TF.Tensor2D;

  /** Normalized label min metadata */
  labelMin?: TF.Tensor2D;

  /** Rank of input tensor */
  inputRank: number;

  /** Rank of label tensor */
  labelRank?: number;
}

/**
 * Options for @see {appDatasetToTensors} function
 * 
 * @typedef AppDatasetToTensorsOptions
 * @prop {boolean} normalize Do dataset normalize and return normalization info
 * @prop {boolean} shaffle Randomize dataset rows indexes
 */

/**
 * Convert app dataset to tensors bundle
 * 
 * @param options AppDatasetToTensorsOptions
 */
export const appDatasetToTensors = (options: { normalize: boolean; shuffle: boolean }) =>
  (dataset: DS.AppDataset): E.Either<ERR.AppError, AppDatasetTensors> =>
    F.pipe(
      dataset,
      E.fromNullable((ERR.createAppError({ message: 'Dataset is null' }))),
      E.chain(_dataset =>
        F.pipe(
          options,
          E.fromNullable(ERR.createAppError({ message: 'Options is null' })),
          E.map(() => {
            const pairs: { input: (string | number)[]; output: (string | number)[] }[] = [];
            const length = IM.getValues(_dataset.cols)[0].data.length;
            for (let index = 0; index < length; index++) {
              F.pipe(
                _dataset,
                DS.readDatasetRow(index),
                E.map(
                  ({ input, output }) => {
                    pairs.push({
                      input,
                      output
                    });
                  }
                )
              );
            }

            return !pairs.length
              ? E.left(ERR.createAppError({ message: 'Can not parse dataset to inputs / outputs' }))
              : E.right(pairs);
          }),
          E.chain(
            E.map(
              pairs => E.tryCatch(
                () => TF.tidy(() => {
                  if (!options.shuffle) {
                    TF.util.shuffle(pairs);
                  }

                  const inputs = pairs.map(x => x.input) as number[][] | string[][];
                  let inputTensor = TF.tensor2d(inputs, [inputs.length, inputs[0].length]);

                  const labels = pairs.every(x => x.output.length) ? pairs.map(x => x.output) as number[][] | string[][] : undefined;
                  let labelTensor;

                  if (labels) {
                    labelTensor = TF.tensor2d(labels, [labels.length, labels[0].length]);
                  }

                  let
                    inputMax,
                    inputMin,
                    labelMax,
                    labelMin,
                    isNormalized = false;

                  if (options.normalize && IM.length(dataset.cols) == IM.getEntities(dataset.cols).filter(({ value }) => [DS.EnumAppDatasetColType.number, DS.EnumAppDatasetColType.sequenceNumber].indexOf(value.type) != -1).length) {
                    const normalizeInputResult = normalizeTensor(inputTensor);
                    inputMax = normalizeInputResult.max;
                    inputMin = normalizeInputResult.min;
                    inputTensor = normalizeInputResult.tensor;

                    if (labelTensor) {
                      const normalizeLabelResult = normalizeTensor(labelTensor);
                      labelMax = normalizeLabelResult.max;
                      labelMin = normalizeLabelResult.min;
                      labelTensor = normalizeLabelResult.tensor;
                    }
                  }

                  return {
                    inputTensor,
                    labelTensor,
                    inputMax,
                    inputMin,
                    labelMax,
                    labelMin,
                    size: pairs.length,
                    inputRank: pairs[0].input.length,
                    labelRank: pairs[0].output.length,
                    isNormalized
                  } as DS.AppDatasetTensors;
                }),
                (error) => ERR.createAppError({ message: String(error) })
              )
            )
          ),
          E.flatten
        )
      )
    );

/**
 * Transform tensor to tensor with normalized data
 * 
 * @param tensor 
 * @param min 
 * @param max 
 */
export const normalizeTensor = <TRank extends TF.Rank>(tensor: TF.Tensor<TRank>, min?: TF.Tensor<TRank>, max?: TF.Tensor<TRank>): { tensor: TF.Tensor<TRank>; min: TF.Tensor<TRank>; max: TF.Tensor<TRank> } => {
  min = tensor.min() as TF.Tensor<TRank>;
  max = tensor.max() as TF.Tensor<TRank>;
  const normTensor = tensor.clone()
    .mul(max).sub(min)
    .add(min) as TF.Tensor<TRank>;

  return {
    min,
    max,
    tensor: normTensor
  };
};

/**
 * Reverse tensor normalization
 * 
 * @param normTensor 
 * @param min 
 * @param max 
 */
export const unNormalizeTensor = <TRank extends TF.Rank>(normTensor: TF.Tensor<TRank>, min: TF.Tensor<TRank>, max: TF.Tensor<TRank>): TF.Tensor<TRank> =>
  normTensor
    .clone()
    .mul(max.sub(min))
    .add(min);