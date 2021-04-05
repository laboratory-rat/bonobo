import { Request, Response } from 'express';
import * as F from '~/fp-ts/function';
import * as TE from '~/fp-ts/TaskEither';
import * as T from '~/fp-ts/Task';
import { dbReadDatasetMetadataEntity } from '@/infrastructure/repository/DatasetMetadataRepository';

export default async (req: Request, res: Response) => {
    const id = req.params['id'] ?? '';

    await F.pipe(
        dbReadDatasetMetadataEntity(id),
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
