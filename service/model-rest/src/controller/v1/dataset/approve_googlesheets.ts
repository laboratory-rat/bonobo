import { DatasetTableApproveModel } from '@/infrastructure/model/dataset';
import { Request, Response } from 'express';
import * as F from '~/fp-ts/function';
import * as TE from '~/fp-ts/TaskEither';
import * as T from '~/fp-ts/Task';
import { applyApproveToDataset } from '@/infrastructure/service/dataset/apply_approve_to_dataset';

export default async (req: Request, res: Response) => {
    const body = req.body as DatasetTableApproveModel;
    await F.pipe(
        body,
        applyApproveToDataset,
        TE.fold(
            (err) => {
                res.status(400);
                res.send(err);
                return T.never;
            },
            () => {
                res.sendStatus(200);
                return T.never;
            }
        )
    )();
};
