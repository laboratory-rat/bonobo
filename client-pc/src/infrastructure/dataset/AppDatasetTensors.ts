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
import {
  AppModel,
  EnumAppModelSubtype,
  EnumAppModelType
} from '@/infrastructure/app_model';
import { AppModelOptionsSequentialSimple } from '@/infrastructure/app_model/options/sequential';

export interface AppDatasetTensorNormalizationData {
  /** Normalized input max metadata */
  inputMax?: TF.Tensor2D;

  /** Normalized input min metadata */
  inputMin?: TF.Tensor2D;

  /** Normalized label max metadata */
  labelMax?: TF.Tensor2D;

  /** Normalized label min metadata */
  labelMin?: TF.Tensor2D;
}

/**
 * Dataset tensors representation
 */
export interface AppDatasetTensors
  extends TF.TensorContainerObject,
    AppDatasetTensorNormalizationData {
  /** How long the tensors are */
  size: number;

  /** Input data as tensor */
  inputTensor: TF.Tensor2D;

  /** Label (output) data as tensor if any */
  labelTensor?: TF.Tensor2D;

  /** Is data normalized */
  isNormalized: boolean;

  /** Rank of input tensor */
  inputRank: number;

  /** Rank of label tensor */
  labelRank?: number;
}

export interface AppDatasetTensorsOptions {
  shuffle: boolean;
  normalize: boolean;
  useStoredNormalization: boolean;
}

/**
 * Private function to transform [] => [][]
 * @param list
 * @param elementsPerSubArray
 */
const toMatrix = (arr: number[], width: number): number[][] =>
  arr.reduce(
    (rows: any[], key: number, index: number) =>
      (index % width == 0
        ? rows.push([key])
        : rows[rows.length - 1].push(key)) && rows,
    []
  );

/**
 * Transform tensor to tensor with normalized data
 *
 * @param tensor
 * @param min
 * @param max
 */
export const normalizeTensor = <TRank extends TF.Rank>(
  tensor: TF.Tensor<TRank>,
  min?: TF.Tensor<TRank>,
  max?: TF.Tensor<TRank>
): {
  tensor: TF.Tensor<TRank>;
  min: TF.Tensor<TRank>;
  max: TF.Tensor<TRank>;
} => {
  if (!min) {
    min = tensor.min() as TF.Tensor<TRank>;
  }

  if (!max) {
    max = tensor.max() as TF.Tensor<TRank>;
  }

  // const normTensor = tensor
  //   .clone()
  //   .mul(max)
  //   .sub(min)
  //   .add(min) as TF.Tensor<TRank>;
  const normTensor = tensor
    .sub(min)
    .div(max.sub(min)) as TF.Tensor<TRank>;

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
export const unNormalizeTensor = <TRank extends TF.Rank>(
  normTensor: TF.Tensor<TRank>,
  min: TF.Tensor<TRank>,
  max: TF.Tensor<TRank>
): TF.Tensor<TRank> =>
  normTensor
    .clone()
    .mul(max.sub(min))
    .add(min);

export const appModelToTensorOptions = (
  model: AppModel,
  isTraining: boolean
): AppDatasetTensorsOptions => {
  if (model.type == EnumAppModelType.sequential) {
    if (model.subtype == EnumAppModelSubtype.simple) {
      const opt = model.options as AppModelOptionsSequentialSimple;
      return {
        normalize: opt.normalizeDataset,
        shuffle: !isTraining ? false : opt.shuffleDataset,
        useStoredNormalization: !isTraining
      };
    }
  }

  throw 'Can not parse dataset to tensors';
};

export const tensorTo2DMatrix = (tensor: TF.Tensor<TF.Rank>): number[][] =>
  toMatrix(Array.from(tensor.dataSync()), tensor.shape[1]!);

/**
 * Transform dataset to tensors
 * Only for 2D tensors!
 * TODO: Split this function to 2D / 3D tensors
 * @param options
 */
export const appDatasetToTensors = (
  options: AppDatasetTensorsOptions,
  storedTensors?: AppDatasetTensorNormalizationData
) => (dataset: DS.AppDataset): E.Either<ERR.AppError, AppDatasetTensors> =>
  F.pipe(
    dataset,
    E.fromNullable(ERR.createAppError({ message: 'Dataset is null' })),
    E.chain(_dataset =>
      F.pipe(
        options,
        E.fromNullable(ERR.createAppError({ message: 'Options is null' })),
        E.map(_options => {
          const pairs: {
            input: number[] | string[];
            output: number[] | string[];
          }[] = [];
          const length = dataset.body.length;
          for (let i = 0; i < length; i++) {
            const row = _dataset.body[i];
            const inputIndexes = _dataset.header
              .filter(x => !x.isOutput)
              .map(x => _dataset.header.indexOf(x));
            pairs.push({
              input: row
                .filter(
                  (col, $colIndex) => inputIndexes.indexOf($colIndex) != -1
                )
                .map(x => x[0]) as number[] | string[],
              output: row
                .filter(
                  (col, $colIndex) => inputIndexes.indexOf($colIndex) == -1
                )
                .map(x => x[0]) as number[] | string[]
            });
          }

          return !pairs.length
            ? E.left(
                ERR.createAppError({
                  message: 'Can not parse dataset to inputs / outputs'
                })
              )
            : E.right(pairs);
        }),
        E.chain(
          E.map(pairs =>
            E.tryCatch(
              () =>
                TF.tidy(() => {
                  if (options.shuffle) {
                    TF.util.shuffle(pairs);
                  }

                  const inputs = pairs.map(x => x.input) as
                    | number[][]
                    | string[][];
                  let inputTensor = TF.tensor2d(inputs, [
                    inputs.length,
                    inputs[0].length
                  ]);

                  const labels = pairs.every(x => x.output.length)
                    ? (pairs.map(x => x.output) as number[][] | string[][])
                    : undefined;
                  let labelTensor;

                  if (labels) {
                    // TODO: Remove this! Only TMP!
                    // This part transforms boolean labels to boolean types (from number[][])
                    const _groupedLabels = (labels as number[][]).reduce((result, item) => {
                      result.indexOf(item[0]) == -1 && result.push(item[0]);
                      return result;
                    }, []);
                    const _labelType = _groupedLabels.length == 2 ? 'bool' : 'float32';
                    const _pLabels = _labelType == 'bool'
                      ? (labels as number[][]).map(x => x[0] == 0 ? [false] : [true])
                      : labels;


                    labelTensor = TF.tensor2d(labels, [
                      labels.length,
                      labels[0].length
                    ], 'float32');
                  }

                  let inputMax, inputMin, labelMax, labelMin;

                  if (options.normalize) {
                    const normalizeInputResult = normalizeTensor(
                      inputTensor,
                      storedTensors?.inputMin,
                      storedTensors?.inputMax
                    );
                    inputMin = normalizeInputResult.min;
                    inputMax = normalizeInputResult.max;
                    inputTensor = normalizeInputResult.tensor;

                    if (labelTensor) {
                      const normalizeLabelResult = normalizeTensor(
                        labelTensor,
                        storedTensors?.labelMin,
                        storedTensors?.labelMax
                      );
                      labelMin = normalizeLabelResult.min;
                      labelMax = normalizeLabelResult.max;
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
                    isNormalized: options.normalize,
                  } as DS.AppDatasetTensors;
                }),
              error => ERR.createAppError({ message: String(error) })
            )
          )
        ),
        E.flatten
      )
    )
  );
