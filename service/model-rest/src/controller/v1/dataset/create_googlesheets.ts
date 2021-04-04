import { Request, Response } from 'express';
import {
    DatasetCreateGooglesheetsModel,
    DatasetTablePreviewModel,
} from '@/infrastructure/model/dataset';
import * as F from '~/fp-ts/function';
import * as TE from '~/fp-ts/TaskEither';
import * as E from '~/fp-ts/Either';
import { uploadGoogleSpreadsheetAndParse } from '@/infrastructure/service/dataset/google_sheet_to_dataset';
import { createDatasetServiceError } from '@/infrastructure/error/dataset_service_error';
import {
    datasetDeleteFile,
    datasetWriteFile,
} from '@/infrastructure/service/dataset/dataset_file';
import { createDatasetMetadataEntity } from '@/infrastructure/entity/DatasetMetadataEntity';
import { DatasetTable } from '~/bnb-model/lib/dataset/dataset';
import { dbCreateDatasetMetadataEntity } from '@/infrastructure/repository/DatasetMetadataRepository';
import { createServiceError } from '@/infrastructure/error';

export default async (req: Request, res: Response) => {
    const body = req.body as DatasetCreateGooglesheetsModel;
    await F.pipe(
        uploadGoogleSpreadsheetAndParse(body.id),
        TE.chain((datasets) => {
            if (!datasets.length) {
                return TE.left(
                    createDatasetServiceError(
                        body.id,
                        'DOCUMENT_NOT_FOUND',
                        'No spreadsheets found'
                    )
                );
            }

            const createFileResults = datasets.map((dataset) => ({
                dataset,
                createResult: datasetWriteFile(dataset, true),
            }));

            if (createFileResults.some((x) => x.createResult._tag == 'Left')) {
                createFileResults
                    .map((x) => x.createResult)
                    .forEach((x) => {
                        if (x._tag == 'Right') {
                            datasetDeleteFile(x.right);
                        }
                    });

                return TE.left(
                    createDatasetServiceError(
                        body.id,
                        'WRITE_FILE_ERROR',
                        'Can not save file'
                    )
                );
            }

            return TE.right(
                createFileResults.map((result) => {
                    const path = (result.createResult as E.Right<string>).right;
                    const dataset = result.dataset as DatasetTable;
                    return {
                        metadata: createDatasetMetadataEntity({
                            spreadsheetId: body.id,
                            columnsCount: dataset.body[0].length!,
                            sourceType: 'GOOGLE_SHEETS',
                            name: dataset.name,
                            isTemporary: true,
                            outputsCount: 0,
                            inputsCount: 0,
                            source: path,
                            size: dataset.body.length,
                            type: '_table',
                        }),
                        dataset,
                    };
                })
            );
        }),
        TE.chain((pairs) =>
            TE.tryCatch(
                async () => {
                    const models = [];
                    for (const { dataset, metadata } of pairs) {
                        const createResult = await dbCreateDatasetMetadataEntity(
                            metadata
                        )();
                        const examplesCount = Math.min(3, dataset.body.length);
                        if (createResult._tag == 'Right') {
                            models.push({
                                id: createResult.right.id,
                                name: metadata.name,
                                spreadsheetId: metadata.spreadsheetId,
                                sheetId: '',
                                columns: dataset.header.map((header, index) => {
                                    return {
                                        index,
                                        originIndex: index,
                                        name: header.title,
                                        type: header.type,
                                        decimals: header.decimals,
                                        examples: [
                                            ...Array(examplesCount).keys(),
                                        ].map((i) =>
                                            dataset.body[i][index].join(',')
                                        ),
                                    };
                                }),
                            } as DatasetTablePreviewModel);
                        }
                    }

                    return TE.right(models);
                },
                (err) => createServiceError('UNEXPECTED_ERROR', String(err))
            )
        ),
        TE.flatten,
        TE.fold(
            (l) => {
                console.error('error', l);
                res.send(l);
                return null;
            },
            (r) => {
                console.log(r);
                res.send(r);
                return null;
            }
        )
    )();
};
