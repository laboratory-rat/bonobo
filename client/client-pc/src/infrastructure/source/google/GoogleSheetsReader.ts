/* eslint-disable @typescript-eslint/camelcase */
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { AppConfig } from '@/infrastructure/AppConfig';
import * as F from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { AppError, createAppError } from '@/infrastructure/core/Error';

const createDocument = (sheetId: string): E.Either<AppError, GoogleSpreadsheet> =>
  sheetId && sheetId.trim().length
    ? E.right(new GoogleSpreadsheet(sheetId.trim()))
    : E.left(createAppError({ message: 'Document id is null' }));

const connectWithServiceAccount = ({ serviceAccounts: { google } }: AppConfig) =>
  (doc: GoogleSpreadsheet): TE.TaskEither<AppError, GoogleSpreadsheet> =>
    TE.tryCatch(
      async () => {
        await doc.useServiceAccountAuth({
          client_email: google.clientEmail,
          private_key: google.privateKey
        });
        return doc;
      },
      (reason) => createAppError({ message: String(reason) })
    );

const loadDocInfo = (doc: GoogleSpreadsheet): TE.TaskEither<AppError, GoogleSpreadsheet> =>
  TE.tryCatch(
    async () => {
      await doc.loadInfo();
      return doc;
    },
    (reason) => createAppError({ message: String(reason) })
  );

/**
 * Read and return Google Sheet document
 * 
 * @param appConfig app config instance
 * @param sheetId google sheet document id
 */
export const readGoogleSheetDocument = (appConfig: AppConfig) =>
  (sheetId: string): TE.TaskEither<AppError, GoogleSpreadsheet> =>
    F.pipe(
      sheetId,
      createDocument,
      TE.fromEither,
      TE.chain(connectWithServiceAccount(appConfig)),
      TE.chain(loadDocInfo)
    );