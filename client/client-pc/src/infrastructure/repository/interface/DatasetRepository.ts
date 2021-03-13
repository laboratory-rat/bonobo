import { AppDataset, AppDatasetApprove } from '@/infrastructure/dataset/AppDataset';
import * as TE from 'fp-ts/TaskEither';
import { AppError } from '@/infrastructure/core';
import { AppDatasetMetadata } from '@/infrastructure/dataset/AppDatasetMetadata';

export interface DatasetRepository {
  CreateFromSpreadsheet(payload: {spreadsheetID: string}): TE.TaskEither<AppError, AppDatasetMetadata[]>;
  ApproveFromSpreadsheet(payload: {metadataID: string; model: AppDatasetApprove}): TE.TaskEither<AppError, unknown>;
  List(payload: {limit: number; startAfter?: string}): TE.TaskEither<AppError, AppDatasetMetadata[]>;
  Read(payload: {ID: string; skip: number; limit: number}): TE.TaskEither<AppError, AppDataset>;
  Archive(payload: {ID: string}): TE.TaskEither<AppError, unknown>;
}


