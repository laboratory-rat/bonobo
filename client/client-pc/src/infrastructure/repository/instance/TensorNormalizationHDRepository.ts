import { TensorNormalizationRepository } from '@/infrastructure/repository/interface/TensorNormalizationRepository';
import * as TE from 'fp-ts/TaskEither';
import * as F from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import { AppError, createAppError } from '@/infrastructure/core';
import { AppDatasetTensorNormalizationData } from '@/infrastructure/dataset';
import * as path from 'path';
import * as fs from 'fs';
import * as TF from '@tensorflow/tfjs';

const PATH_MODELS = '.model';
const FILE_NORMALIZATION = '_normalization.json';
const createPath = (id: string) =>
  path.join(PATH_MODELS, id, FILE_NORMALIZATION);

interface NormalizationSaveFormat {
  inputMax: number[];
  inputMin: number[];
  labelMax: number[];
  labelMin: number[];
}

export const createTensorNormalizationHDRepository = (): TensorNormalizationRepository => {
  return {
    write(
      modelID: string,
      normalization: AppDatasetTensorNormalizationData
    ): TE.TaskEither<AppError, AppDatasetTensorNormalizationData> {
      return F.pipe(
        E.tryCatch(
          () => {
            const path = createPath(modelID);
            if (fs.existsSync(path)) {
              fs.rmdirSync(path, {
                recursive: true
              });
            }

            const nModel: NormalizationSaveFormat = {
              inputMax: Array.from(normalization.inputMax!.dataSync()),
              inputMin: Array.from(normalization.inputMin!.dataSync()),
              labelMax: Array.from(normalization.labelMax!.dataSync()),
              labelMin: Array.from(normalization.labelMin!.dataSync())
            };

            fs.writeFileSync(path, JSON.stringify(nModel), {
              encoding: 'utf-8'
            });
            return E.right(normalization);
          },
          reason => createAppError({ message: String(reason) })
        ),
        E.flatten,
        TE.fromEither
      );
    },

    read(
      modelID: string
    ): TE.TaskEither<AppError, AppDatasetTensorNormalizationData> {
      return F.pipe(
        E.tryCatch(
          () => {
            const path = createPath(modelID);
            const stored = JSON.parse(
              fs.readFileSync(path, {
                encoding: 'utf-8'
              })
            ) as NormalizationSaveFormat;
            console.log(stored);
            return E.right({
              inputMax: TF.tensor2d(stored.inputMax, [stored.inputMax.length, 1]),
              inputMin: TF.tensor2d(stored.inputMin, [stored.inputMin.length, 1]),
              labelMax: TF.tensor2d(stored.labelMax, [stored.labelMax.length, 1]),
              labelMin: TF.tensor2d(stored.labelMin, [stored.labelMin.length, 1])
            } as AppDatasetTensorNormalizationData);
          },
          reason => createAppError({ message: String(reason) })
        ),
        E.flatten,
        TE.fromEither
      );
    }
  };
};
