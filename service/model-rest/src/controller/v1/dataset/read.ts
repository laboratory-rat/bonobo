import { Request, Response } from 'express';
import * as F from '~/fp-ts/function';
import * as TE from '~/fp-ts/TaskEither';
import { dbReadDatasetMetadataEntity } from '@/infrastructure/repository/DatasetMetadataRepository';
import { datasetReadFile } from '@/infrastructure/service/dataset/dataset_file';

export default async (req: Request, res: Response) => {
    const id = req.params['id'] ?? '';
    const skip = Math.max(parseInt(req.params['skip']) ?? 0, 0);
    const limit = Math.max(parseInt(req.params['limit']) ?? 1, 1);
    const loadAll = req.query['all'] ?? false;

    await F.pipe(
        dbReadDatasetMetadataEntity(id),
        TE.chain((metadata) => F.pipe(datasetReadFile(metadata.source), TE.fromEither)),
        TE.chain((dataset) => {
            const _skip = loadAll ? 0 : Math.min(skip, dataset.size);
            const _limit = loadAll ? dataset.size : Math.min(limit, dataset.size);
            const result = dataset.body.slice(skip, limit);
            return TE.right(result);
        }),
        TE.fold(
            (err) => {
                res.status(400);
                res.send(err);
                return null;
            },
            (r) => {
                res.send(r);
                return null;
            }
        )
    )();
};
