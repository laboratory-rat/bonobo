import { Request, Response } from 'express';
import { ModelCreateRequestModel } from '@/infrastructure/model/model';
import * as F from '~/fp-ts/function';
import * as T from '~/fp-ts/Task';
import * as TE from '~/fp-ts/TaskEither';
import { modelCreate } from '@/infrastructure/service/model/model_service';

export default async (req: Request, res: Response) => {
    await F.pipe(
        req.body as ModelCreateRequestModel,
        modelCreate,
        TE.fold(
            (err) => {
                res.status(500);
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
