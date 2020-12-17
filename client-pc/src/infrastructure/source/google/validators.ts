import { SourceGoogleSheetWorksheetScheme } from '.';
import * as IM from '@/infrastructure/core/IndexedMap';
import * as E from 'fp-ts/Either';
import * as F from 'fp-ts/function';
import * as ER from '@/infrastructure/core/Error';
import * as SER from './errors';
import { EnumAppDatasetColType, EnumAppDatasetProcessType } from '@/infrastructure/dataset';

const lift = <T>(f: (a: T) => E.Either<ER.AppError, T>): (val: T) => E.Either<ER.AppError[], T> =>
  (v: T): E.Either<ER.AppError[], T> =>
    F.pipe(
      f(v),
      E.mapLeft(err => [err])
    );

const createValidationError = (message: string) => SER.createSourceGoogleError(SER.EnumSourceGoogleErrors.validation, {
  error: message,
  message: message
});

const validateTrain = (source: SourceGoogleSheetWorksheetScheme): E.Either<ER.AppError[], unknown> =>
  F.pipe(
    source.cols,
    IM.getEntities,
    lift((cols) => cols.length ? E.right(cols) : E.left(createValidationError('Column list is emprty'))),
    E.chain(lift((cols) => cols.filter(x => x.value.isInclude && x.value.isOutput).length ? E.right(cols) : E.left(createValidationError('Output columns are required')))),
    E.chain(lift((cols) => cols.filter(x => x.value.isInclude && !x.value.isOutput).length ? E.right(cols) : E.left(createValidationError('Input columns are required')))),
    E.chain(lift((cols) => !cols.filter(x => x.value.isInclude).filter(x => x.value.colType == EnumAppDatasetColType.category || x.value.colType == EnumAppDatasetColType.sequenceCategory).length ? E.right(cols) : E.left(createValidationError('Categories are not available at the moment'))))
  );

const validateValidation = (source: SourceGoogleSheetWorksheetScheme): E.Either<ER.AppError[], unknown> =>
  F.pipe(
    source.cols,
    IM.getEntities,
    lift((cols) => cols.length ? E.right(cols) : E.left(createValidationError('Column list is emprty'))),
    E.chain(lift((cols) => cols.filter(x => x.value.isInclude && x.value.isOutput).length ? E.right(cols) : E.left(createValidationError('Output columns are required')))),
    E.chain(lift((cols) => cols.filter(x => x.value.isInclude && !x.value.isOutput).length ? E.right(cols) : E.left(createValidationError('Input columns are required')))),
    E.chain(lift((cols) => !cols.filter(x => x.value.isInclude).filter(x => x.value.colType == EnumAppDatasetColType.category || x.value.colType == EnumAppDatasetColType.sequenceCategory).length ? E.right(cols) : E.left(createValidationError('Categories are not available at the moment'))))
  );

const validatePrediction = (source: SourceGoogleSheetWorksheetScheme): E.Either<ER.AppError[], unknown> =>
  F.pipe(
    source.cols,
    IM.getEntities,
    lift((cols) => cols.length ? E.right(cols) : E.left(createValidationError('Column list is emprty'))),
    E.chain(lift((cols) => !cols.filter(x => x.value.isInclude && x.value.isOutput).length ? E.right(cols) : E.left(createValidationError('Output columns are not available for this type')))),
    E.chain(lift((cols) => cols.filter(x => x.value.isInclude && !x.value.isOutput).length ? E.right(cols) : E.left(createValidationError('Input columns are required')))),
    E.chain(lift((cols) => !cols.filter(x => x.value.isInclude).filter(x => x.value.colType == EnumAppDatasetColType.category || x.value.colType == EnumAppDatasetColType.sequenceCategory).length ? E.right(cols) : E.left(createValidationError('Categories are not available at the moment'))))
  );

/**
 * Validate scheme properties and return left<errors list> if failed
 * @param data - source data scheme to validate
 */
export const sourceGoogleSheetWorksheetSchemeValidator = (data: SourceGoogleSheetWorksheetScheme): E.Either<ER.AppError[], unknown> =>
  F.pipe(
    data,
    E.fromNullable([createValidationError('Google source is null')]),
    E.chain(lift((data) => data.name && data.name.trim().length ? E.right(data) : E.left(createValidationError('Name is required')))),
    E.chain(lift((data) => IM.length(data.cols) ? E.right(data) : E.left(createValidationError('Columns are required')))),
    E.chain(x => {
      switch (x.type) {
        case EnumAppDatasetProcessType.training:
          return validateTrain(data);
        case EnumAppDatasetProcessType.prediction:
          return validatePrediction(data);
        case EnumAppDatasetProcessType.validation:
          return validateValidation(data);
        default:
          return E.left([createValidationError('Impossible type')]);
      }
    })
  );