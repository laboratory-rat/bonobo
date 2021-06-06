import { Request, Response } from 'express';
import * as F from '~/fp-ts/function';
import * as TE from '~/fp-ts/TaskEither';
import * as T from '~/fp-ts/Task';
import { dbDeleteDatasetMetadataEntity, dbReadDatasetMetadataEntity } from '@/infrastructure/repository/dataset_metadata_repository';
import { datasetDeleteFile } from '@/infrastructure/service/dataset/dataset_file';

export default async (req: Request, res: Response) => {
    const id = req.params['id'] ?? '';

    await F.pipe(
        dbReadDatasetMetadataEntity(id),
        TE.chain((metadata) =>
            F.pipe(
                dbDeleteDatasetMetadataEntity(metadata.id),
                TE.map((_) => metadata)
            )
        ),
        TE.chain((metadata) => F.pipe(datasetDeleteFile(metadata.source), TE.fromEither)),
        TE.fold(
            (err) => {
                res.status(400);
                res.send(err);
                return T.never;
            },
            (r) => {
                res.send(r);
                return T.never;
            }
        )
    )();
};
