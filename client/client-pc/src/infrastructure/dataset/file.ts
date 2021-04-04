/**
 * Dataset tools package
 * 
 * @packageDocumentation AppDataset
 * @module AppDataset
 */


import * as fs from 'fs';
import * as path from 'path';
import * as F from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import { AppDataset } from '.';
import { AppError, createAppError } from '../core';
import { AppDatasetMetadata } from './AppDatasetMetadata';
import * as yaml from 'js-yaml';

/**
 * Id expose model
 * @memberof dataset
 * @typedef IdModel
 * @prop {string} id - Id
 */

const LOCAL_DATASET_FOLDER = '.dataset';
const METADATA_FILENAME = '_metadata.yaml';
const DATASET_FILENAME = 'data';

const datasetsPaths = () => path.join('./', LOCAL_DATASET_FOLDER);
// const datasetsPaths = () => path.join(electron.remote.app.getPath('appData'), LOCAL_DATASET_FOLDER);

const fullDatasetPath = (id: string) => path.join(datasetsPaths(), id);

const checkLocalDatasetsFolder = (): boolean => fs.existsSync(datasetsPaths());

const createLocalDatasetsFolder = () => fs.mkdirSync(datasetsPaths());

const validateDatasetsFolder = () => {
  if (!checkLocalDatasetsFolder()) createLocalDatasetsFolder();
};

/**
 * Save dataset to local folder
 * @memberof dataset
 * @function
 * @param {AppDataset} dataset
 * @param {!Partial<AppDatasetMetadata>} [metadata] - Exists metadata (for resave already exists)
 * @return {Either<AppError, unknown>}
 */
// export const writeDataset = (dataset: AppDataset, metadata?: Partial<AppDatasetMetadata>): E.Either<AppError, unknown> => {
//   validateDatasetsFolder();
//   return F.pipe(
//     dataset,
//     E.fromNullable(createAppError({ message: 'No dataset to save' })),
//     E.chain(createAppDatasetMetadata),
//     E.map(meta => {
//       meta = {
//         ...metadata
//       };
//
//       const datasetFolderPath = fullDatasetPath("");
//       if (datasetFolderPath) {
//         fs.rmdirSync(datasetFolderPath, {
//           recursive: true
//         });
//       }
//
//       fs.mkdirSync(datasetFolderPath);
//       const metadataPath = path.join(datasetFolderPath, METADATA_FILENAME);
//       const datasetPath = path.join(datasetFolderPath, DATASET_FILENAME);
//       fs.writeFileSync(metadataPath, yaml.safeDump(meta), { encoding: 'utf-8' });
//       fs.writeFileSync(datasetPath, JSON.stringify(dataset), { encoding: 'utf-8' });
//     })
//   );
// };

/**
 * Scan datasets folder and return list of exists metadatas
 * @memberof dataset
 * @function
 * @return {AppDatasetMetadata[]}
 */
export const scanMetadatas = (): AppDatasetMetadata[] => {
  validateDatasetsFolder();
  const result = [] as AppDatasetMetadata[];
  fs.readdirSync(datasetsPaths(), { withFileTypes: true }).filter(x => x.isDirectory()).forEach(directory => {
    if (fs.existsSync(path.join(datasetsPaths(), directory.name, METADATA_FILENAME)) && fs.existsSync(path.join(datasetsPaths(), directory.name, DATASET_FILENAME))) {
      try {
        result.push(
          yaml.safeLoad(
            fs.readFileSync(
              path.join(datasetsPaths(), directory.name, METADATA_FILENAME),
              {
                encoding: 'utf-8'
              },
            )
          ) as AppDatasetMetadata
        );
      } catch (_) {
        fs.rmdirSync(path.join(datasetsPaths(), directory.name), { recursive: true });
      }
    }
  });

  return result;
};


/**
 * Read dataset by provided metadata
 * @memberof dataset
 * @function
 * @param {IdModel} payload - Dataset id in model
 * @return {E.Either<AppError, AppDataset>}
 */
export const readDataset = (payload: { id: string }): E.Either<AppError, AppDataset> =>
  E.tryCatch(
    () => {
      const dPath = path.join(datasetsPaths(), payload.id, DATASET_FILENAME);
      return JSON.parse(
        fs.readFileSync(dPath, { encoding: 'utf-8' })
      ) as AppDataset;
    },
    (error) => createAppError({ message: String(error) })
  );


/**
 * Read metadata by id if exists
 * @memberof dataset
 * @function
 * @param {string} id - Id of target metadata
 * @return {E.Either<AppError, AppDatasetMetadata>}
 */
export const readMetadataById = (id: string): E.Either<AppError, AppDatasetMetadata> =>
  E.tryCatch(
    () => {
      const mPath = path.join(datasetsPaths(), id, METADATA_FILENAME);
      return yaml.safeLoad(
        fs.readFileSync(mPath, { encoding: 'utf-8' })
      ) as AppDatasetMetadata;
    },
    (reason) => createAppError({ message: String(reason) })
  );

export const deleteDatasetById = (payload: { id: string }) => {
  fs.rmdirSync(fullDatasetPath(payload.id), {
    recursive: true
  });
};
