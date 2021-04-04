/**
 * @packageDocumentation AppModel
 */

import { AppModel } from './AppModel';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import * as TF from '@tensorflow/tfjs-node';
import * as AM from '@/infrastructure/app_model';
import { AppError, createAppError } from '../core';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { AppModelHistory } from './AppModelHistory';
import { AppModelPredictionMetadata, AppModelPredictionResult } from './AppModelPrediction';

const PATH_MODELS = '.model';
const FILE_MODEL_NAME = '_metadata.yaml';
const FILE_MODEL_HISTORY = '_history.yaml';
const FILE_MODEL_NORMALIZATION = '_narmalization';
const modelFolder = (payload: { id: string }) => path.join(PATH_MODELS, payload.id);
const pathModelPredictionResultsFolder = (payload: { modelId: string }) => path.join(modelFolder({ id: payload.modelId }), '.results');
const modelPath = (payload: { id: string }) => path.join(modelFolder(payload), FILE_MODEL_NAME);
const tfModelPath = (payload: { id: string }) => 'indexeddb://' + PATH_MODELS + '/' + payload.id;
const historyPath = (payload: { id: string }) => path.join(modelFolder(payload), FILE_MODEL_HISTORY);
const modelResultsFile = (payload: { id: string; modelId: string }) => path.join(pathModelPredictionResultsFolder(payload), payload.id);
const modelResultsMetadataFile = (payload: { id: string; modelId: string }) => path.join(pathModelPredictionResultsFolder(payload), `${payload.id}__metadata.yaml`);
const modelNormalizationPath = (payload: { id: string }) => path.join(modelFolder(payload), FILE_MODEL_NORMALIZATION);

const validateModelFolder = () => {
  if (!fs.existsSync(PATH_MODELS)) {
    fs.mkdirSync(PATH_MODELS);
  }
};

const validateAppModelResultsFolders = (payload: { modelId: string }) => {
  [true, false]
    .map(x => ({ ...payload, isValidation: x }))
    .map(pathModelPredictionResultsFolder)
    .forEach(path => {
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
      }
    });
};

/**
 * Write app model to file
 * File contains metadata about model
 * 
 * @param model - model to write
 */
export const writeAppModel = (model: AppModel): E.Either<AppError, unknown> =>
  E.tryCatch(
    () => {
      validateModelFolder();
      const _pathFolder = modelFolder(model);
      const _pathFile = modelPath(model);
      if (!fs.existsSync(_pathFolder)) {
        fs.mkdirSync(modelFolder(model));
      }

      if (fs.existsSync(_pathFile)) {
        fs.rmdirSync(_pathFile, {
          recursive: true,
        });
      }

      fs.writeFileSync(modelPath(model), yaml.safeDump(model), {
        encoding: 'utf-8'
      });
    },
    (reason) => createAppError({ message: String(reason) })
  );

/**
 * Read app model from file
 * 
 * @param payload - id of required model
 */
export const readAppModel = (payload: { id: string }): E.Either<AppError, AppModel> =>
  E.tryCatch(
    () => {
      validateModelFolder();
      const _path = modelPath(payload);
      return yaml.safeLoad(
        fs.readFileSync(_path, {
          encoding: 'utf-8',
        })
      ) as AppModel;
    },
    (reason) => createAppError({ message: String(reason) })
  );

/**
 * Scan app folder for existing models
 */
export const scanAppModels = (): E.Either<AppError, AppModel[]> =>
  E.tryCatch(
    () => {
      validateModelFolder();
      const results = [] as AppModel[];
      fs.readdirSync(PATH_MODELS, {
        withFileTypes: true
      })
        .filter(x => x.isDirectory())
        .forEach(directory => {
          if (fs.existsSync(path.join(modelPath({ id: directory.name })))) {
            try {
              results.push(
                yaml.safeLoad(
                  fs.readFileSync(
                    path.join(modelPath({ id: directory.name })),
                    {
                      encoding: 'utf-8'
                    }
                  )
                ) as AppModel
              );
            } catch (_) {
              fs.rmdirSync(path.join(modelPath({ id: directory.name })));
            }
          }
        });
      return results;
    },
    (reason) => createAppError({ message: String(reason) })
  );


/**
 * Save TF model to files
 * (currently saves to the IndexedDB)
 * 
 * @param model - Id of the model
 */
export const writeTFModel = (model: { id: string }) =>
  (tfModel: TF.Sequential): TE.TaskEither<AppError, unknown> =>
    TE.tryCatch(
      async () => {
        return await tfModel.save(tfModelPath(model), {
          includeOptimizer: true
        });
      },
      (reason) => createAppError({ message: String(reason) })
    );

/**
 * Read TF model from memory (IndexedDB)
 * @param payload - id of required model
 */
export const readTFModel = (payload: { id: string }) => (): TE.TaskEither<AppError, AM.AppTFModel> =>
  TE.tryCatch(
    async () => {
      const readResult = await TF.loadLayersModel(tfModelPath(payload));
      return readResult as AM.AppTFModel;
    },
    (reason) => createAppError({ message: String(reason) })
  );

/**
 * Write training history of the model
 * 
 * @param payload - id of target model
 */
export const writeAppModelHistory = (payload: { id: string }) => (history: AppModelHistory): E.Either<AppError, unknown> =>
  E.tryCatch(
    () => {
      validateModelFolder();
      if (fs.existsSync(historyPath(payload))) {
        fs.rmdirSync(historyPath(payload), {
          recursive: true
        });
      }

      fs.writeFileSync(
        historyPath(payload),
        yaml.safeDump(history),
        {
          encoding: 'utf-8'
        }
      );
    },
    (err) => createAppError({ message: String(err) })
  );

/**
 * Read training history
 * @param payload - model id
 */
export const readAppModelHistory = (payload: { id: string }): E.Either<AppError, AM.AppModelHistory> =>
  E.tryCatch(
    () => {
      validateModelFolder();
      return yaml.safeLoad(
        fs.readFileSync(historyPath(payload), {
          encoding: 'utf-8'
        })
      ) as AM.AppModelHistory;
    },
    (reason) => createAppError({ message: String(reason) })
  );

/**
 * Delete App Model with all related files
 * (does not delete TF models from IndexedDB)
 * @param payload - model id
 */
export const deleteAppModelFolder = (payload: { id: string }): E.Either<AppError, unknown> =>
  E.tryCatch(
    () => {
      if (fs.existsSync(modelFolder(payload))) {
        fs.rmdirSync(modelFolder(payload), {
          recursive: true
        });
      }
    },
    (error) => createAppError({ message: String(error) })
  );

/**
 * Read all available predictions metadatas of selected model
 * @param payload - model id
 */
export const scanAppModelPredictionMetadatas = (payload: { modelId: string }): E.Either<AppError, AppModelPredictionMetadata[]> =>
  E.tryCatch(
    () => {
      validateAppModelResultsFolders(payload);
      const results = [] as AppModelPredictionMetadata[];
      console.log(pathModelPredictionResultsFolder(payload));
      fs.readdirSync(pathModelPredictionResultsFolder(payload),
        {
          withFileTypes: true
        })
        .filter(x => !x.isDirectory() && x.name.search('__metadata.yaml'))
        .forEach(({ name }) => {
          if (fs.existsSync(path.join(pathModelPredictionResultsFolder({ ...payload }), name))) {
            try {
              results.push(
                yaml.safeLoad(
                  fs.readFileSync(
                    path.join(pathModelPredictionResultsFolder({ ...payload }), name),
                    {
                      encoding: 'utf-8'
                    }
                  )
                ) as AppModelPredictionMetadata
              );
            } catch (e) {
              console.error(e);
            }
          }
        });

      return results;
    },
    (reason) => createAppError({ message: String(reason) })
  );

/**
 * Read prediction metadata of model
 * @param payload - model id and prediction metadata id
 */
export const readAppModelPredictionMetadata = (payload: { id: string; modelId: string }): E.Either<AppError, AppModelPredictionMetadata> =>
  E.tryCatch(
    () => {
      validateAppModelResultsFolders(payload);
      const _path = modelResultsMetadataFile(payload);
      return yaml.safeLoad(
        fs.readFileSync(_path, {
          encoding: 'utf-8'
        })
      ) as AppModelPredictionMetadata;
    },
    (reason) => createAppError({ message: String(reason) })
  );

/**
 * Write prediction metadata to file
 * @param payload - model id and prediction id
 */
export const writeAppModelPredictionMetadata = (payload: AppModelPredictionMetadata): E.Either<AppError, AppModelPredictionMetadata> =>
  E.tryCatch(
    () => {
      validateAppModelResultsFolders(payload);
      const _path = modelResultsMetadataFile(payload);
      const _pathResult = modelResultsFile(payload);
      [_path, _pathResult].forEach(path => {
        if (fs.existsSync(path)) {
          fs.rmdirSync(path);
        }
      });

      fs.writeFileSync(_path, yaml.safeDump(payload), {
        encoding: 'utf-8'
      });

      return payload;
    },
    (reason) => createAppError({ message: String(reason) })
  );

/**
 * Read prediction result
 * @param payload - model id and prediction id
 */
export const readAppModelPredictionResult = (payload: { id: string; modelId: string }): E.Either<AppError, AM.AppModelPredictionResult> =>
  E.tryCatch(
    () => {
      validateAppModelResultsFolders(payload);
      const _path = modelResultsFile(payload);
      return JSON.parse(
        fs.readFileSync(_path, {
          encoding: 'utf-8'
        })
      ) as AM.AppModelPredictionResult;
    },
    (reason) => createAppError({ message: String(reason) })
  );

/**
 * Check if prediction result exists
 * @param payload - model id and prediction id
 */
export const existsAppModelPredictionResult = (payload: { id: string; modelId: string }): boolean => {
  validateAppModelResultsFolders(payload);
  return fs.existsSync(modelResultsFile(payload));
};

/**
 * Write prediction result
 * @param payload - prediction result + model id + isValidation
 */
export const writeAppModelPredictionResult = (payload: { predictionResult: AppModelPredictionResult; modelId: string; isValidation: boolean }): E.Either<AppError, unknown> =>
  E.tryCatch(
    () => {
      const id = payload.predictionResult?.id;
      if (!id) throw 'Model id is null';

      validateAppModelResultsFolders(payload);
      const _path = modelResultsFile({ ...payload, id });
      if (fs.existsSync(_path)) {
        fs.rmdirSync(_path);
      }

      fs.writeFileSync(
        _path,
        JSON.stringify(payload.predictionResult),
        {
          encoding: 'utf-8'
        }
      );
    },
    (reason) => createAppError({ message: String(reason) })
  );

/**
 * Delete prediction result file
 * @param payload - model id and prediction id
 */
export const deleteAppModelPredictionResult = (payload: { id: string; modelId: string; isValidation: boolean }): E.Either<AppError, unknown> =>
  E.tryCatch(
    () => {
      validateAppModelResultsFolders(payload);
      const _paths = [modelResultsMetadataFile(payload), modelResultsFile(payload)];
      _paths.forEach(path => {
        if (fs.existsSync(path)) {
          fs.rmdirSync(path);
        }
      });
    },
    (reason) => createAppError({ message: String(reason) })
  );

export const writeAppModelNormalization = (modelId: string) => (data: AM.AppModelNormailzationData): TE.TaskEither<AppError, AM.AppModelNormailzationData> =>
  TE.tryCatch(
    async () => {
      validateModelFolder();
      const _path = modelNormalizationPath({ id: modelId });
      if (fs.existsSync(_path)) {
        fs.rmdirSync(_path, {
          recursive: true
        });
      }

      const toSave = {
        inputMax: await data.inputMax.array(),
        inputMin: await data.inputMin.array(),
        labelMax: await data.labelMax.array(),
        labelMin: await data.labelMin.array(),
      };

      fs.writeFileSync(_path, JSON.stringify(toSave), {
        encoding: 'utf-8'
      });

      return data;
    },
    (reason) => createAppError({ message: String(reason) })
  );

export const readAppModelNormalization = (modelId: string): TE.TaskEither<AppError, AM.AppModelNormailzationData> =>
  TE.tryCatch(
    async () => {
      validateModelFolder();
      const _path = modelNormalizationPath({ id: modelId });
      if (fs.existsSync(_path)) {
        throw 'No normalization file found';
      }

      const file = fs.readFileSync(_path, {
        encoding: 'utf-8'
      });

      const deserialized = JSON.parse(file) as number[][] | number[][][];
      return {
        inputMax: TF.tensor(deserialized[0] as number[]),
        inputMin: TF.tensor(deserialized[1] as number[]),
        labelMax: TF.tensor(deserialized[2] as number[]),
        labelMin: TF.tensor(deserialized[3] as number[]),
      } as AM.AppModelNormailzationData;
    },
    (reason) => createAppError({ message: String(reason) })
  );