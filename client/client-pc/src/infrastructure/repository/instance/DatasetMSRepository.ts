import { DatasetRepository } from '@/infrastructure/repository/interface/DatasetRepository';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as TE from 'fp-ts/TaskEither';
import * as F from 'fp-ts/function';
import { AppError, createAppError } from '@/infrastructure/core';
import { AppDatasetMetadata } from '@/infrastructure/dataset';
import {
  AppDataset,
  AppDatasetApprove
} from '@/infrastructure/dataset/AppDataset';

export const createDatasetMSRepository = (config: {
  host: string;
}): DatasetRepository => {
  const createRequest = (args: {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    model?: unknown;
  }): Promise<AxiosResponse<unknown>> => {
    const _config = {
      method: args.method,
      url: `${config.host}/${args.path}`,
      responseType: 'json'
    } as Partial<AxiosRequestConfig>;

    if (args.model) {
      _config.data = args.model;
    }

    return axios.request(_config);
  };

  const processError = (reason: unknown): AppError =>
    createAppError({ message: String(reason) });

  return {
    CreateFromSpreadsheet: (payload: {
      spreadsheetID: string;
    }): TE.TaskEither<AppError, AppDatasetMetadata[]> =>
      F.pipe(
        TE.tryCatch(
          () =>
            createRequest({
              method: 'GET',
              path: `create/spreadsheet/${payload.spreadsheetID}`
            }),
          processError
        ),
        TE.map(
          ({ data }) => data as AppDatasetMetadata[]
        ),
        TE.chain(s => {
          return TE.of(s);
        })
      ),

    ApproveFromSpreadsheet(payload: {
      metadataID: string;
      model: AppDatasetApprove;
    }): TE.TaskEither<AppError, unknown> {
      return TE.tryCatch(
        () =>
          createRequest({
            method: 'PUT',
            path: `approve/${payload.metadataID}`,
            model: payload.model
          }),
        processError
      );
    },

    List(payload: {
      limit: number;
      startAfter?: string;
    }): TE.TaskEither<AppError, AppDatasetMetadata[]> {
       return F.pipe(
        TE.tryCatch(
          () =>
            createRequest({
              method: 'GET',
              path: `list/${payload.limit}?start_after=${payload.startAfter}`
            }),
          processError
        ),
        TE.map(({ data }) => data as AppDatasetMetadata[])
      );
    },

    Read(payload: {
      ID: string;
      skip: number;
      limit: number;
    }): TE.TaskEither<AppError, AppDataset> {
      return F.pipe(
        TE.tryCatch(
          () =>
            createRequest({
              method: 'GET',
              path: `read/${payload.ID}/${payload.skip}/${payload.limit}`
            }),
          processError
        ),
        TE.map(({ data }) => data as AppDataset)
      );
    },

    Archive(payload: { ID: string }): TE.TaskEither<AppError, unknown> {
      return TE.tryCatch(
        () =>
          createRequest({
            method: 'DELETE',
            path: `archive/${payload.ID}`
          }),
        processError
      );
    }
  };
};
