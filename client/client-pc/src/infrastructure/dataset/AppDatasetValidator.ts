import { AppDatasetApprove } from '@/infrastructure/dataset/AppDataset';
import * as E from 'fp-ts/Either';
import * as F from 'fp-ts/function';
import { AppError, createAppError } from '@/infrastructure/core';
import { EnumAppDatasetMetadataProcessType } from '@/infrastructure/dataset/enums';

export interface AppDatasetValidationError {
  code: string;
  message: string;
  critical: boolean;
}

const _CE = (
  err: Partial<AppDatasetValidationError>
): AppDatasetValidationError => ({
  code: 'UNDEFINED',
  message: 'NO MESSAGE',
  critical: true,
  ...err
});

export const appDatasetApproveValidate = (
  dataset: AppDatasetApprove
): E.Either<AppError, AppDatasetApprove> => {
  const _ce = (message: string) =>
    createAppError({ message: message, code: 'DATASET_ERROR', error: message });
  const validateName = (
    dataset: AppDatasetApprove
  ): E.Either<AppError, AppDatasetApprove> =>
    !dataset.name || !dataset.name.length
      ? E.left(_ce('Name is empty'))
      : E.right(dataset);
  const validateHeaders = (
    dataset: AppDatasetApprove
  ): E.Either<AppError, AppDatasetApprove> => {
    if (!dataset.header || !dataset.header.length) {
      return E.left(_ce('No columns selected'));
    }
    const inputCount = dataset.header.filter(x => !x.isOutput).length,
      outputCount = dataset.header.length - inputCount;

    switch (dataset.datasetProcessType) {
      case EnumAppDatasetMetadataProcessType.training:
        if (inputCount < 1) {
          return E.left(_ce('No input columns selected'));
        }

        if (outputCount < 1) {
          return E.left(_ce('No output columns selected'));
        }
        break;
      case EnumAppDatasetMetadataProcessType.prediction:
        if (inputCount < 1) {
          return E.left(_ce('No input columns selected'));
        }

        if (outputCount != 0) {
          return E.left(_ce('Output columns are not allowed in this mode'));
        }
        break;
      case EnumAppDatasetMetadataProcessType.validation:
        if (inputCount < 1) {
          return E.left(_ce('No input columns selected'));
        }

        if (outputCount < 1) {
          return E.left(_ce('No output columns selected'));
        }
        break;
      default:
        throw 'Impossible error';
    }

    return E.right(dataset);
  };

  return F.pipe(
    dataset,
    E.fromNullable(_ce('Dataset is null')),
    E.chain(validateName),
    E.chain(validateHeaders)
  );
};
