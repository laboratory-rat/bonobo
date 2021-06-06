import { TF } from '../connector';

export interface NormalizationMinMaxResult<TRank extends TF.Rank> {
    original: TF.Tensor<TRank>;
    min: TF.Tensor<TRank>;
    max: TF.Tensor<TRank>;
    normalized: TF.Tensor<TRank>;
}

export const normalizeTensor = <TRank extends TF.Rank.R2 | TF.Rank.R3>(tensor: TF.Tensor<TRank>, min?: TF.Tensor<TRank>, max?: TF.Tensor<TRank>): NormalizationMinMaxResult<TRank> => {
    max ??= tensor.max() as TF.Tensor<TRank>;
    min ??= tensor.min() as TF.Tensor<TRank>;
    const normalized = tensor.sub(min).div(max.sub(min)) as TF.Tensor<TRank>;
    return {
        original: tensor,
        min,
        max,
        normalized,
    };
};

export const denormalizeTensor = <TRank extends TF.Rank>(tensor: TF.Tensor<TRank>, min: TF.Tensor<TRank>, max: TF.Tensor<TRank>): TF.Tensor<TRank> => tensor.mul(max.sub(min)).add(min);

export const serializeTensor = (tensor: TF.Tensor): number | number[] | number[][] | number[][][] | number[][][][] | number[][][][][] => tensor.arraySync();

export const parseTensor = <TRank extends TF.Rank>(array: number | number[] | number[][] | number[][][] | number[][][][] | number[][][][][]): TF.Tensor<TRank> => TF.tensor(array);
