import { Dataset } from '~/bnb-model/lib/dataset/index';
import * as F from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import { createDatasetServiceError } from '@/infrastructure/error/dataset_service_error';
import { createFileConfig } from '@/config/file';
import { v4 } from 'uuid';
import * as fs from 'fs';
import { createServiceError, ServiceError } from '@/infrastructure/error';

const checkDirs = (path: string) => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, {
            recursive: true,
        });
    }
};

export const datasetWriteFile = (dataset: Dataset, isTmp: boolean): E.Either<ServiceError, string> =>
    F.pipe(
        dataset,
        E.fromNullable(createDatasetServiceError(null, 'WRITE_FILE_ERROR', 'File is null')),
        E.chain((dataset) => {
            const fileConfig = createFileConfig();
            const directory = isTmp ? fileConfig.datasetTmpPath : fileConfig.datasetPath;
            checkDirs(directory);
            const path = directory + '/' + v4();

            if (fs.existsSync(path)) {
                fs.rmSync(path);
            }

            fs.writeFileSync(path, JSON.stringify(dataset), {
                encoding: 'utf-8',
            });

            return E.right(path);
        })
    );

export const datasetReadFile = (path: string): E.Either<ServiceError, Dataset> =>
    F.pipe(
        path,
        E.fromNullable(createDatasetServiceError(null, 'READ_FILE_ERROR', 'Path is null')),
        E.chain((path) => {
            if (!fs.existsSync(path)) {
                return E.left(createDatasetServiceError(null, 'READ_FILE_ERROR', 'File is not exists'));
            }

            return E.right(
                fs.readFileSync(path, {
                    encoding: 'utf-8',
                })
            );
        }),
        E.chain((buffer) =>
            E.tryCatch(
                () => JSON.parse(buffer) as Dataset,
                (reason) => createDatasetServiceError(null, 'READ_FILE_ERROR', String(reason))
            )
        )
    );

export const datasetDeleteFile = (path: string): E.Either<ServiceError, unknown> =>
    F.pipe(
        path,
        E.fromNullable(createServiceError('DELETE_FILE_ERROR', 'Path is null')),
        E.chain((path) => {
            if (!fs.existsSync(path)) {
                return E.left(createServiceError('DELETE_FILE_ERROR', 'File not found'));
            }

            fs.rmSync(path, {
                recursive: true,
            });

            return E.right(null);
        })
    );
