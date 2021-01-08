import { GoogleSpreadsheet, GoogleSpreadsheetRow } from 'google-spreadsheet';
import moment from 'moment';
import * as IM from '@/infrastructure/core/IndexedMap';
import * as TE from 'fp-ts/lib/TaskEither';
import { AppError, createAppError } from '@/infrastructure/core';
import { EnumAppDatasetMetadataColType } from '@/infrastructure/dataset';

export interface SourceGoogleSheet {
  id: string;
  title: string;
  lastSyncTime: number;
  worksheets: SourceGoogleWorksheet[];
}

export interface SourceGoogleWorksheet {
  id: string;
  title: string;
  index: number;
  isHidden: boolean;
  cols: IM.IndexedMap<SourceGoogleWorksheetCol>;
}

export interface SourceGoogleWorksheetCol {
  include: boolean;
  originalIndex: number;
  title: string;
  values: object[];
  type: EnumAppDatasetMetadataColType;
  decimals: number | null;
}

const systemRowsPropertyKeys = ['a1Range', 'rowIndex', 'rowNumber'];

export const createFromGoogleSheet = (payload: GoogleSpreadsheet): TE.TaskEither<AppError, SourceGoogleSheet> =>
  TE.tryCatch(
    async () => {
      await Promise.all(payload.sheetsByIndex.map((sheet) => sheet.loadHeaderRow().catch(() => null)));
      const filteredSheets = payload.sheetsByIndex.filter(x => x && x.headerValues && x.headerValues.length);
      const sheetToRowsMap = new Map<number, GoogleSpreadsheetRow[]>();

      for (const sheet of filteredSheets) {
        sheetToRowsMap.set(sheet.index, await sheet.getRows());
      }

      const sheetColsMap = {} as IM.IndexedMap<IM.IndexedMap<SourceGoogleWorksheetCol>>;
      sheetToRowsMap.forEach((sheetRows, sheetIndex) => {
        const titles: string[] = [];
        const valuesMap: IM.IndexedMap<object[]> = {};

        sheetRows.forEach((row) => {
          for (const key of Object.keys(row)) {
            if (!key.startsWith('_') && systemRowsPropertyKeys.indexOf(key) === -1) {
              if (titles.indexOf(key) === -1) {
                titles.push(key);
              }

              const colIndex = titles.indexOf(key);
              if (!valuesMap[colIndex]) valuesMap[colIndex] = [];
              valuesMap[colIndex].push(row[key]);
            }
          }
        });

        const sheetCols = {} as IM.IndexedMap<SourceGoogleWorksheetCol>;
        titles.forEach((title, titleIndex) => {
          sheetCols[titleIndex] = {
            decimals: 0,
            include: true,
            originalIndex: titleIndex,
            title: title,
            type: EnumAppDatasetMetadataColType.STRING_ARRAY,
            values: valuesMap[titleIndex]
          };
        });

        sheetColsMap[sheetIndex] = sheetCols;
      });

      const result = {
        id: payload.spreadsheetId,
        title: payload.title,
        lastSyncTime: moment().unix(),
        worksheets: filteredSheets.map((sheet, i) => ({
          id: sheet.sheetId,
          index: sheet.index,
          title: sheet.title,
          isHidden: sheet.hidden ?? false,
          cols: sheetColsMap[i]
        }) as SourceGoogleWorksheet)
      } as SourceGoogleSheet;

      return result;
    },
    (reason) => createAppError({ message: String(reason) })
  );
