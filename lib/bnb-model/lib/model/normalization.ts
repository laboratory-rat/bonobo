export type ModelNormalizationStrategy = 'NONE' | 'INDIVIDUAL' | 'MATRIX';

export interface ModelNormalizationData {
    strategy: ModelNormalizationStrategy;
    inputNormalizationMatrix: { min: number[][][]; max: number[][][] } | null;
    inputNormalizationPairs: { min: number[][]; max: number[][] }[] | null;
    labelNormalizationMatrix: { min: number[][][]; max: number[][][] } | null;
}
