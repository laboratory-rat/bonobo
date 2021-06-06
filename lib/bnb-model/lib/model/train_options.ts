import { ModelNormalizationStrategy } from '@lib/model/normalization';

export interface TrainOptions {
    epochsCount: number;
    normalizeStrategy: ModelNormalizationStrategy;
    batchSize: number;
    shuffleDataset: boolean;
    validationSplit?: number;
}
