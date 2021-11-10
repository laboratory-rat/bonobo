import { DatasetTableSource } from './source';
import { ModelNormalizationData, ModelNormalizationStrategy } from '@lib/model/normalization';
import { createError, ERR } from '@lib/error';
import * as F from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import { denormalizeTensor, normalizeTensor, transposeMatrix, transposeMatrixRevert } from '@lib/util';
import { TF } from '@lib/connector';
import { tensor2d } from '@tensorflow/tfjs-node';

export type Dataset = DatasetTable | DatasetImage;
export type DatasetType = '_table' | '_image';
// export type DatasetTableColType = '_numberArray';
export type DatasetTableColType = '_stringArray' | '_numberArray';
export type ErrorTypeDataset = 'DATASET_NORMALIZE_ERROR' | 'DATASET_DENORMALIZE_ERROR';

const _createError = (type: ErrorTypeDataset, message: unknown, innerError?: ERR) => createError(type, message, innerError);

interface BaseDataset {
    type: DatasetType;
    name: string;
    size: number;
    createdTime: number;
    updatedTime: number;
}

export interface DatasetTable extends BaseDataset {
    type: '_table';
    source: DatasetTableSource;
    header: DatasetTableHeader[];
    body: number[][][];
}

export interface DatasetImage extends BaseDataset {
    type: '_image';
    body: DatasetImageCollectionItem[];
}

export interface DatasetTableHeader {
    type: DatasetTableColType;
    title: string;
    labels?: { key: number[]; label: string }[];
    index: number;
    decimals: number;
    originIndex: number;
    isOutput: boolean;
}

export interface DatasetImageCollectionItem {
    imageSrc: string;
    width: number;
    height: number;
    label: number[];
    hint: string;
}

export interface NormalizationDatasetResult {
    input: TF.Tensor3D;
    label: TF.Tensor3D | null;
    normalizationData: ModelNormalizationData;
}

export const normalizeDataset = (payload: { dataset: Dataset; inputIndexes: number[]; strategy: ModelNormalizationStrategy; normalizationData?: ModelNormalizationData }): E.Either<ERR, NormalizationDatasetResult> => {
    if (payload.dataset.type == '_image') {
        return E.left(_createError('DATASET_NORMALIZE_ERROR', 'Unimplemented error'));
    }

    return F.pipe(
        payload.dataset.body,
        E.fromNullable(_createError('DATASET_NORMALIZE_ERROR', 'Dataset is empty')),
        E.chain((body) =>
            E.tryCatch(
                () => {
                    const { strategy, inputIndexes, normalizationData } = payload;

                    const input3d = body.map((row) => row.filter((_, colIndex) => inputIndexes.indexOf(colIndex) !== -1));
                    const label3d = body.map((row) => row.filter((_, colIndex) => inputIndexes.indexOf(colIndex) === -1));
                    const input3dTensor = TF.tensor3d(input3d);

                    const normalizeLabels = (normalizationDataset: NormalizationDatasetResult, labels: number[][][]): NormalizationDatasetResult => {
                        if (labels.length) {
                            const normalizedLabel = normalizeTensor(TF.tensor3d(label3d), normalizationData?.labelNormalizationMatrix?.min ? TF.tensor3d([[[normalizationData.labelNormalizationMatrix.min]]]) : undefined, normalizationData?.labelNormalizationMatrix?.max ? TF.tensor3d([[[normalizationData.labelNormalizationMatrix.max]]]) : undefined);
                            normalizationDataset.label = normalizedLabel.normalized;
                            normalizationDataset.normalizationData.labelShape = normalizedLabel.normalized.shape;
                            normalizationDataset.normalizationData.labelNormalizationMatrix = {
                                min: (normalizedLabel.min.arraySync() as unknown) as number,
                                max: (normalizedLabel.max.arraySync() as unknown) as number,
                            };
                        }

                        return normalizationDataset;
                    };

                    if (strategy == 'NONE') {
                        return {
                            input: input3dTensor,
                            label: label3d.length ? TF.tensor3d(label3d) : null,
                            normalizationData: {
                                strategy,
                                inputShape: input3dTensor.shape,
                                labelShape: label3d.length ? TF.tensor3d(label3d).shape : null,
                                inputNormalizationMatrix: null,
                                inputNormalizationPairs: null,
                                labelNormalizationMatrix: null,
                                labelNormalizationPairs: null,
                            },
                        } as NormalizationDatasetResult;
                    }

                    if (strategy == 'MATRIX') {
                        const normalizedInput = normalizeTensor(input3dTensor, normalizationData?.inputNormalizationMatrix?.min ? TF.tensor3d([[[normalizationData.inputNormalizationMatrix.min]]]) : undefined, normalizationData?.inputNormalizationMatrix?.max ? TF.tensor3d([[[normalizationData.inputNormalizationMatrix.max]]]) : undefined);
                        const result = {
                            input: normalizedInput.normalized,
                            label: null,
                            normalizationData: {
                                strategy,
                                inputShape: normalizedInput.normalized.shape,
                                inputNormalizationPairs: null,
                                labelNormalizationMatrix: null,
                                labelNormalizationPairs: null,
                                labelShape: null,
                                inputNormalizationMatrix: {
                                    min: (normalizedInput.min.arraySync() as unknown) as number,
                                    max: (normalizedInput.max.arraySync() as unknown) as number,
                                },
                            },
                        } as NormalizationDatasetResult;
                        return normalizeLabels(result, label3d);
                    }

                    if (strategy == 'INDIVIDUAL') {
                        const inputTransposed = transposeMatrix(input3d);
                        const normalizedPairs = inputTransposed.map((column: number[][], index) => {
                            const min = normalizationData?.inputNormalizationPairs && normalizationData?.inputNormalizationPairs[index]?.min ? tensor2d([[normalizationData?.inputNormalizationPairs[index]?.min]]) : undefined;
                            const max = normalizationData?.inputNormalizationPairs && normalizationData?.inputNormalizationPairs[index]?.max ? tensor2d([[normalizationData?.inputNormalizationPairs[index]?.max]]) : undefined;
                            return normalizeTensor(TF.tensor2d(column), min, max);
                        });

                        const inputNormalizedArray = transposeMatrixRevert(normalizedPairs.map((x) => x.normalized.arraySync()));
                        const input = TF.tensor3d(inputNormalizedArray as number[][][]);

                        const result = {
                            input,
                            label: null,
                            normalizationData: {
                                strategy,
                                inputShape: input.shape,
                                labelShape: null,
                                labelNormalizationPairs: null,
                                inputNormalizationMatrix: null,
                                inputNormalizationPairs: normalizedPairs.map((x) => ({
                                    min: (x.min.arraySync() as unknown) as number,
                                    max: (x.max.arraySync() as unknown) as number,
                                })),
                                labelNormalizationMatrix: null,
                            },
                        } as NormalizationDatasetResult;

                        if (label3d.length) {
                            const labelTransposed = transposeMatrix(label3d);
                            const labelNormalizedPairs = labelTransposed.map((column: number[][], index) => {
                                const min = normalizationData?.labelNormalizationPairs && normalizationData.labelNormalizationPairs[index]?.min ? tensor2d([[normalizationData.labelNormalizationPairs[index].min]]) : undefined;
                                const max = normalizationData?.labelNormalizationPairs && normalizationData.labelNormalizationPairs[index]?.max ? tensor2d([[normalizationData.labelNormalizationPairs[index].max]]) : undefined;
                                return normalizeTensor(TF.tensor2d(column), min, max);
                            });
                            const labelNormalizedArray = transposeMatrixRevert(labelNormalizedPairs.map((x) => x.normalized.arraySync()));
                            result.label = TF.tensor3d(labelNormalizedArray as number[][][]);
                            result.normalizationData.labelShape = TF.tensor3d(labelNormalizedArray as number[][][]).shape;
                            result.normalizationData.labelNormalizationPairs = labelNormalizedPairs.map((x) => ({
                                max: (x.max.arraySync() as unknown) as number,
                                min: (x.min.arraySync() as unknown) as number,
                            }));
                        }

                        return result;
                    }

                    throw `Unknown normalize strategy ${strategy}`;
                },
                (error) => _createError('DATASET_NORMALIZE_ERROR', String(error))
            )
        )
    );
};

export const denormalizeResponse = (payload: { response: TF.Tensor3D; strategy: ModelNormalizationStrategy; normalizationData?: ModelNormalizationData }): E.Either<ERR, TF.Tensor3D> =>
    F.pipe(
        payload.response,
        E.fromNullable(_createError('DATASET_DENORMALIZE_ERROR', 'Response is null')),
        E.chain((response) =>
            E.tryCatch(
                () => {
                    const { strategy, normalizationData } = payload;
                    if (strategy == 'NONE') {
                        return response;
                    }

                    if (!normalizationData) {
                        throw `Normalization data is required on strategy ${strategy}`;
                    }

                    switch (strategy) {
                        case 'MATRIX': {
                            if (!normalizationData.labelNormalizationMatrix?.min || !normalizationData.labelNormalizationMatrix?.max) {
                                throw 'No normalization data';
                            }
                            const { min, max } = normalizationData.labelNormalizationMatrix;
                            return denormalizeTensor(response, TF.tensor3d([[[min]]]), TF.tensor3d([[[max]]]));
                        }
                        case 'INDIVIDUAL': {
                            if (!normalizationData.labelNormalizationPairs?.length) {
                                throw 'No normalization pairs found';
                            }

                            const responseToColumns = transposeMatrix(response.arraySync())
                                .map((col, index) => denormalizeTensor(TF.tensor2d(col), TF.tensor2d([[normalizationData.labelNormalizationPairs![index].min]]), TF.tensor2d([[normalizationData.labelNormalizationPairs![index].max]])))
                                .map((tensor) => tensor.arraySync());

                            return TF.tensor3d(transposeMatrixRevert(responseToColumns) as number[][][]);
                        }
                        default:
                            throw `Unknown strategy type ${strategy}`;
                    }
                },
                (reason) => _createError('DATASET_DENORMALIZE_ERROR', reason)
            )
        )
    );
