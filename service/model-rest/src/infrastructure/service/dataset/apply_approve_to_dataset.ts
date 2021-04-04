import * as F from '~/fp-ts/function';
import * as E from '~/fp-ts/Either';
import * as TE from '~/fp-ts/TaskEither';
import { DatasetMetadataEntity } from '@/infrastructure/entity/DatasetMetadataEntity';
import { DatasetTableApproveModel } from '@/infrastructure/model/dataset';
import { Dataset } from '~/bnb-model/lib/dataset/index';
import { DatasetServiceError } from '@/infrastructure/error/dataset_service_error';
import { createServiceError, ServiceError } from '@/infrastructure/error';
import { dbReadDatasetMetadataEntity, dbUpdateMetadataEntity } from '@/infrastructure/repository/DatasetMetadataRepository';
import { datasetDeleteFile, datasetReadFile, datasetWriteFile } from '@/infrastructure/service/dataset/dataset_file';
import { DatasetTable } from '~/bnb-model/lib/dataset/dataset';
import moment from '~/moment/moment';

export const applyApproveToDataset = (model: DatasetTableApproveModel): TE.TaskEither<ServiceError, unknown> =>
    F.pipe(
        model,
        E.fromNullable(createServiceError('BAD_MODEL', 'Model is null')),
        TE.fromEither,
        TE.chain((model) =>
            F.pipe(
                dbReadDatasetMetadataEntity(model.id),
                TE.map((metadata) => ({ metadata, model }))
            )
        ),
        TE.chain((pair) =>
            F.pipe(
                datasetReadFile(pair.metadata.source),
                E.map((dataset) => ({
                    ...pair,
                    dataset: dataset as DatasetTable,
                })),
                TE.fromEither
            )
        ),
        TE.chain(({ dataset, model, metadata }) =>
            TE.tryCatch(
                async () => {
                    const originIndexesToActual = new Map<number, number>(model.columns.sort((x) => x.index).map((x) => [x.originIndex, x.index]));
                    const updatedHeader = [];
                    for (const [originIndex, index] of originIndexesToActual.entries()) {
                        const header = dataset.header[originIndex];
                        const column = model.columns.filter((x) => x.index == index)[0]!;

                        header.index = index;
                        header.decimals = column.decimals;
                        header.type = column.type;
                        header.isOutput = column.isOutput;
                        header.title = column.title;

                        updatedHeader.push(header);
                    }

                    const updatedBody = dataset.body.map((row) => {
                        const columns = Array(originIndexesToActual.size);
                        row.forEach((col, index) => {
                            const newIndex = originIndexesToActual.get(index);
                            if (newIndex) {
                                columns[newIndex] = col;
                            }
                        });

                        return columns;
                    });

                    dataset.body = updatedBody;
                    dataset.header = updatedHeader;
                    metadata.outputsCount = updatedHeader.filter((x) => x.isOutput).length;
                    metadata.inputsCount = updatedHeader.length - metadata.outputsCount;
                    metadata.name = model.name;
                    dataset.updatedTime = moment().unix();
                    metadata.updatedTime = moment().unix();

                    return { metadata, dataset };
                },
                (reason) => createServiceError('DATASET_APPLY_ERROR', String(reason))
            )
        ),
        TE.chain(({ metadata, dataset }) =>
            F.pipe(
                datasetDeleteFile(metadata.source),
                TE.fromEither,
                TE.map((_) => ({
                    metadata,
                    dataset,
                }))
            )
        ),
        TE.chain(({ metadata, dataset }) =>
            F.pipe(
                datasetWriteFile(dataset, false),
                E.map((source) => ({
                    metadata: {
                        ...metadata,
                        isTemporary: false,
                        source,
                    },
                    dataset,
                })),
                TE.fromEither
            )
        ),
        TE.chain(({ metadata, dataset }) => F.pipe(metadata, dbUpdateMetadataEntity))
    );
