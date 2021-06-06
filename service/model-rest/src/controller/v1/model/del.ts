import { Request, Response } from 'express';
import * as F from '~/fp-ts/lib/function';
import * as TE from '~/fp-ts/lib/TaskEither';
import * as T from '~/fp-ts/lib/Task';
import { dbDeleteModelEntity } from '@/infrastructure/repository/model_repository';

/// TODO: add cascade delete of tf_model and tasks
export default async (req: Request, res: Response) => {
    const id = req.params['id'] ?? '';

    await F.pipe(
        dbDeleteModelEntity(id),
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
