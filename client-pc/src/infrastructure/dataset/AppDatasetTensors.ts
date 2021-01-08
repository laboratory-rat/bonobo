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
import { EnumAppDatasetMetadataColType } from './';
import * as ERR from '@/infrastructure/core/Error';
import * as IM from '@/infrastructure/core/IndexedMap';
import { AppDataset } from '@/infrastructure/dataset/AppDataset';

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

const parseDatasetRow = (row: unknown[][], type: EnumAppDatasetMetadataColType) => {
  switch (type) {
    case EnumAppDatasetMetadataColType.NUMBER_ARRAY:
      return row as number[][];
    case EnumAppDatasetMetadataColType.STRING_ARRAY:
      return row as string[][];
    default:
      throw 'Error';
  }
};

/**
 * Options for @see {appDatasetToTensors} function
 *
 * TODO: only process 2D number arrays! Update for 3D / 2D strings
 * @typedef AppDatasetToTensorsOptions
 * @prop {boolean} normalize Do dataset normalize and return normalization info
 * @prop {boolean} shuffle Randomize dataset rows indexes
 */

export const appDatasetToTensors2D = (options: {normalize: boolean; shuffle: boolean}) =>
  (payload: AppDataset): E.Either<ERR.AppError, AppDatasetTensors> =>
    F.pipe(
      payload,
      E.fromNullable((ERR.createAppError({message: 'Dataset is null'}))),
      E.chain(_dataset =>
        F.pipe(
          options,
          E.fromNullable((ERR.createAppError({message: 'Options is null'}))),
          E.map(_o => ({
            options: _o,
            dataset: _dataset
          }))
        )),
      E.map(_ => {
        const {options, dataset} = _;
        const pairs: { input: (string | number)[]; output: (string | number)[] }[] = [];
        const _flatRow = (row: unknown[][], type: EnumAppDatasetMetadataColType): (string | number)[] => {
          switch (type) {
            case EnumAppDatasetMetadataColType.STRING_ARRAY:
              return row.map((_) => _[0] as string);
            case EnumAppDatasetMetadataColType.NUMBER_ARRAY:
              return row.map((_) => _[0] as number);
            default:
              throw 'Unexpected error';
          }
        };


        return E.left(ERR.createAppError({message: 'TEST'}));
      }),
      E.flatten
    );

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
                    labelMin;

                  if (options.normalize && IM.length(dataset.cols) == IM.getEntities(dataset.cols).filter(({ value }) => [DS.EnumAppDatasetMetadataColType.NUMBER_ARRAY].indexOf(value.type) != -1).length) {
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
                    isNormalized: false,
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
