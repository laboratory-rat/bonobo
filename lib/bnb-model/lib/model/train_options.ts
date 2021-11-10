export interface TrainOptions {
    epochsCount: number;
    batchSize: number;
    shuffleDataset: boolean;
    validationSplit?: number;
}
