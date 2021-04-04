import { Request, Response } from 'express';
import * as F from '~/fp-ts/function';
import * as TE from '~/fp-ts/TaskEither';
import { DatasetFilterModel, DatasetFindResponse } from '@/infrastructure/model/dataset';
import { dbCountMetadataEntity, dbFindMetadataEntity } from '@/infrastructure/repository/DatasetMetadataRepository';

export default async (req: Request, res: Response) => {
    const skip = Math.max(parseInt(req.params['from']) ?? 0, 0);
    const limit = Math.max(parseInt(req.params['limit']) ?? 1, 1);
    const filter = (req.body as DatasetFilterModel) ?? {
        sort: 'updatedTime',
        desc: true,
        filter: {},
    };

    await F.pipe(
        dbFindMetadataEntity(skip, limit, filter),
        TE.chain((list) =>
            F.pipe(
                dbCountMetadataEntity(filter.filter),
                TE.map(
                    (total) =>
                        ({
                            total,
                            limit,
                            skip,
                            list,
                        } as DatasetFindResponse)
                )
            )
        ),
        TE.fold(
            (err) => {
                res.status(400);
                res.send(err);
                return null;
            },
            (result) => {
                res.send(result);
                return null;
            }
        )
    )();
};
