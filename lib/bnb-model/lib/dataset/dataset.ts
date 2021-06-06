import { DatasetTableSource } from './source';
import { ModelNormalizationData, ModelNormalizationStrategy } from '@lib/model/normalization';
import { createError, ERR } from '@lib/error';
import * as F from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import { normalizeTensor } from '@lib/util';
import { TF } from '@lib/connector';
import { tensor2d } from '@tensorflow/tfjs-node';

export type Dataset = DatasetTable | DatasetImage;
export type DatasetType = '_table' | '_image';
// export type DatasetTableColType = '_numberArray';
export type DatasetTableColType = '_stringArray' | '_numberArray';
export type ErrorTypeDataset = 'DATASET_NORMALIZE_ERROR';

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
                            const normalizedLabel = normalizeTensor(TF.tensor3d(label3d), normalizationData?.labelNormalizationMatrix?.min ? TF.tensor3d(normalizationData.labelNormalizationMatrix.min) : undefined, normalizationData?.labelNormalizationMatrix?.max ? TF.tensor3d(normalizationData.labelNormalizationMatrix.max) : undefined);
                            normalizationDataset.label = normalizedLabel.normalized;
                            normalizationDataset.normalizationData.labelNormalizationMatrix = {
                                min: normalizedLabel.min.arraySync(),
                                max: normalizedLabel.max.arraySync(),
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
                                inputNormalizationMatrix: null,
                                inputNormalizationPairs: null,
                                labelNormalizationMatrix: null,
                            },
                        } as NormalizationDatasetResult;
                    }

                    if (strategy == 'MATRIX') {
                        const normalizedInput = normalizeTensor(input3dTensor, normalizationData?.inputNormalizationMatrix?.min ? TF.tensor3d(normalizationData.inputNormalizationMatrix.min) : undefined, normalizationData?.inputNormalizationMatrix?.max ? TF.tensor3d(normalizationData.inputNormalizationMatrix.max) : undefined);
                        const result = {
                            input: normalizedInput.normalized,
                            label: null,
                            normalizationData: {
                                strategy,
                                inputNormalizationPairs: null,
                                labelNormalizationMatrix: null,
                                inputNormalizationMatrix: {
                                    min: normalizedInput.min.arraySync(),
                                    max: normalizedInput.max.arraySync(),
                                },
                            },
                        } as NormalizationDatasetResult;
                        return normalizeLabels(result, label3d);
                    }

                    if (strategy == 'INDIVIDUAL') {
                        const inputToColumns: number[][][] = [];
                        const columnsNumber = input3d[0].length;
                        for (let currentColNumber = 0; currentColNumber < columnsNumber; currentColNumber++) {
                            inputToColumns.push(input3d.map((row) => row[currentColNumber]));
                        }

                        const normalizedPairs = inputToColumns.map((column, index) => {
                            const min = normalizationData?.inputNormalizationPairs && normalizationData?.inputNormalizationPairs[index]?.min ? tensor2d(normalizationData?.inputNormalizationPairs[index]?.min) : undefined;
                            const max = normalizationData?.inputNormalizationPairs && normalizationData?.inputNormalizationPairs[index]?.max ? tensor2d(normalizationData?.inputNormalizationPairs[index]?.max) : undefined;

                            return normalizeTensor(TF.tensor2d(column), min, max);
                        });

                        const input = TF.tensor3d(normalizedPairs.map((x) => x.normalized.arraySync()));

                        const result = {
                            input,
                            label: null,
                            normalizationData: {
                                strategy,
                                inputNormalizationMatrix: null,
                                inputNormalizationPairs: normalizedPairs.map((x) => ({
                                    min: x.min.arraySync(),
                                    max: x.max.arraySync(),
                                })),
                                labelNormalizationMatrix: null,
                            },
                        } as NormalizationDatasetResult;

                        return normalizeLabels(result, label3d);
                    }

                    throw `Unknown normalize strategy ${strategy}`;
                },
                (error) => _createError('DATASET_NORMALIZE_ERROR', String(error))
            )
        )
    );
};
