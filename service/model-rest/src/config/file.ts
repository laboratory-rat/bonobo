export interface FileConfig {
    datasetPath: string;
    datasetTmpPath: string;
    modelPath: string;
    modelTFPath: string;
}

export const createFileConfig = (): FileConfig => ({
    datasetPath: '_data/dataset/saved',
    datasetTmpPath: '_data/dataset/tmp',
    modelPath: '_data/model',
    modelTFPath: '_data/tf_model',
});
