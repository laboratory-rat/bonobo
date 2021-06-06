export interface ModelVersionEntity {
    _id: string;
    version: number;
    modelId: string;
    trainingResultId: string;
    datasetName: string;
    datasetId: string;
    optimizerJson: string;
    epochsCount: number;
    batch?: number;
    isFinished: boolean;
    isStarted: boolean;
    error?: string;
    createdTime: number;
    updatedTime: number;
}

export interface ModelVersionTrainResultEntity {
    _id: string;
    versionId: string;
    version: number;
    modelId: string;
    createdTime: number;
    updatedTime: number;
}
