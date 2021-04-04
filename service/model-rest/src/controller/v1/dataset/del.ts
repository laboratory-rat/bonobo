import { Request, Response } from 'express';
import * as F from '~/fp-ts/function';
import * as TE from '~/fp-ts/TaskEither';
import { dbDeleteDatasetMetadataEntity } from '@/infrastructure/repository/DatasetMetadataRepository';

export default async (req: Request, res: Response) => {
    const id = req.params['id'] ?? '';

    await F.pipe(
        dbDeleteDatasetMetadataEntity(id),
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
