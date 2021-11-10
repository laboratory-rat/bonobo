export type ModelNormalizationStrategy = 'NONE' | 'INDIVIDUAL' | 'MATRIX';

export interface ModelNormalizationData {
    strategy: ModelNormalizationStrategy;
    inputShape: [number, number, number];
    labelShape: [number, number, number] | null;

    // data for matrix normalization
    inputNormalizationMatrix: { min: number; max: number } | null;
    labelNormalizationMatrix: { min: number; max: number } | null;

    // data for individual normalization
    inputNormalizationPairs: { min: number; max: number }[] | null;
    labelNormalizationPairs: { min: number; max: number }[] | null;
}
