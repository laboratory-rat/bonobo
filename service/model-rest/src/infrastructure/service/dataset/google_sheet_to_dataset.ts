import { Dataset } from '~/bnb-model/lib/dataset/index';
import * as E from '~/fp-ts/Either';
import * as F from '~/fp-ts/function';
import * as TE from '~/fp-ts/TaskEither';
import { createGoogleSpreadsheetDatasetServiceError } from '@/infrastructure/error/dataset_service_error';
import { createGoogleSpreadsheetReader } from '@/connector/google_spreadsheet';
import { ServiceError } from '@/infrastructure/error';
import { DatasetTable } from '~/bnb-model/lib/dataset/dataset';
import moment from '~/moment/moment';

const _e = createGoogleSpreadsheetDatasetServiceError;

export const uploadGoogleSpreadsheetAndParse = (
    id: string
): TE.TaskEither<ServiceError, Dataset[]> =>
    F.pipe(
        id,
        E.fromNullable(_e(null, 'DOCUMENT_ID_NULL', 'Document id is null')),
        TE.fromEither,
        TE.chain((id) =>
            TE.tryCatch(
                async () => createGoogleSpreadsheetReader(id),
                (reason) => _e(id, 'PARSE_ERROR', String(reason))
            )
        ),
        TE.chain((spreadsheet) =>
            TE.tryCatch(
                async () => {
                    const result = [];
                    for (const sheet of spreadsheet.sheetsByIndex) {
                        if (sheet.sheetType != 'GRID') continue;
                        const rows = await sheet.getRows();
                        if (!rows.length) continue;

                        const headers: string[] = [];
                        const rawValues = [];
                        for (const prop of Object.getOwnPropertyNames(
                            rows[0]
                        ).filter(
                            (x) =>
                                ['a1Range', 'rowIndex'].indexOf(x) === -1 &&
                                !x.startsWith('_')
                        )) {
                            headers.push(prop);
                        }

                        if (!headers.length) continue;

                        for (const row of rows.slice(1, rows.length - 1)) {
                            const _row = [];
                            for (const prop of headers) {
                                _row.push(row[prop]?.trim() ?? null);
                            }
                            if (_row.some((x) => x == null || x == ''))
                                continue;
                            rawValues.push(_row);
                        }

                        if (!rawValues.length) continue;
                        const parsedValues = rawValues.map((row) =>
                            row.map(_parseCell)
                        );
                        result.push({
                            type: '_table',
                            createdTime: moment().unix(),
                            updatedTime: moment().unix(),
                            header: headers.map((header, index) => ({
                                decimals: 0,
                                index,
                                isOutput: false,
                                originIndex: index,
                                title: header,
                                // type: '_stringArray',
                                type: parsedValues.every((row) =>
                                    row[index].every((x) =>
                                        /^[+-]?[0-9.]+/.test(String(x))
                                    )
                                )
                                    ? '_numberArray'
                                    : '_stringArray',
                            })),
                            body: parsedValues,
                            name: 'Some name',
                            size: parsedValues.length,
                            source: {
                                type: 'GOOGLE_SPREADSHEETS',
                                link: '',
                                sheetId: sheet.sheetId,
                                spreadsheetId: spreadsheet.spreadsheetId,
                            },
                        } as DatasetTable);
                    }

                    return result;
                },
                (reason) => _e(id, 'PARSE_ERROR', String(reason))
            )
        )
    );

const _parseCell = (val: string): unknown[] => {
    const _trimmed = val.trim();
    return _trimmed.startsWith('[') && _trimmed.endsWith(']')
        ? _trimmed.substr(1, _trimmed.length - 2).split(',')
        : [_trimmed];
};
