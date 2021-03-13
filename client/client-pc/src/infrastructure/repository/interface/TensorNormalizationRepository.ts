import * as TE from 'fp-ts/TaskEither';
import { AppError } from '@/infrastructure/core';
import { AppDatasetTensorNormalizationData } from '@/infrastructure/dataset';

export interface TensorNormalizationRepository {
  write(modelID: string, normalization: AppDatasetTensorNormalizationData): TE.TaskEither<AppError, AppDatasetTensorNormalizationData>;
  read(modelID: string): TE.TaskEither<AppError, AppDatasetTensorNormalizationData>;
}
