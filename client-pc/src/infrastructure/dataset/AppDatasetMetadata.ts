/**
 * Dataset tools package
 * 
 * @packageDocumentation
 * @module AppDataset
 */

import { EnumAppDatasetSource, EnumAppDatasetProcessType } from './enums';
import { AppDataset, readDatasetRow } from './AppDataset';
import { AppError, createAppError, generageId as generateId } from '../core';
import moment from 'moment';
import * as E from 'fp-ts/Either';
import * as F from 'fp-ts/function';

/**
 * @ignore
 */
const datasetIdLength = 8;

/**
 * App dataset metadata.
 * Contains short dataset info but no raw data inside.
 * 
 * @caption Must be sync with actual dataset
 */
export interface AppDatasetMetadata {
  /** Dataset id */
  id: string;

  /** Dataset naem */
  name: string;

  /** Dataset created time */
  createdTime: number;

  /** Dataset updated time */
  updatedTime: number;

  /** Dataset source type */
  source: EnumAppDatasetSource;

  /** How to process dataset type */
  type: EnumAppDatasetProcessType;

  /** Columns count */
  colsCount: number;

  /** Columns that used as input count */
  colsInputsCount: number;

  /** Origin source id if any */
  sourceId?: string;

  /** Source index (worksheet index) */
  sourceIndex: number;
}

/**
 * Create metadata from exists dataset
 * 
 * @param dataset Dataset to process
 */
export const createAppDatasetMetadata = (dataset: AppDataset): E.Either<AppError, AppDatasetMetadata> =>
  F.pipe(
    dataset,
    E.fromNullable(createAppError({ message: 'Dataset is null' })),
    E.map(readDatasetRow(0)),
    E.chain(E.map(firstRow => ({
      colsCount: firstRow.input.length + firstRow.output.length,
      colsInputsCount: firstRow.input.length,
      createdTime: moment.utc().unix(),
      id: generateId(datasetIdLength),
      name: dataset.name,
      source: dataset.source,
      type: dataset.processType,
      updatedTime: moment.utc().unix(),
      sourceIndex: dataset.sourceIndex,
      sourceId: dataset.sourceId
    }) as AppDatasetMetadata))
  );
