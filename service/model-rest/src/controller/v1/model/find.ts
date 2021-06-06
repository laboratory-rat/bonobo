import { Request, Response } from 'express';
import { ModelEntity } from '@/infrastructure/entity/model_entity';
import * as T from '~/fp-ts/Task';
import * as TE from '~/fp-ts/TaskEither';
import * as F from '~/fp-ts/function';
import { dbCountModelEntity, dbFindModelEntity } from '@/infrastructure/repository/model_repository';
import { FilterRequestModel, FilterResponseModel } from '@/infrastructure/model/search';

const _valueOr = (val: unknown) => Math.max(1, val ? parseInt(String(val)) : 0);

export default async (req: Request, res: Response) => {
    const skip = _valueOr(req.params['skip']);
    const limit = _valueOr(req.params['limit']);
    const filter = (req.body as FilterRequestModel<ModelEntity>) ?? {
        desc: true,
        sort: 'createdTime',
        search: {},
    };

    await F.pipe(
        dbFindModelEntity(skip, limit, filter),
        TE.chain((list) =>
            F.pipe(
                dbCountModelEntity(filter?.search),
                TE.map(
                    (total) =>
                        ({
                            total,
                            limit,
                            skip,
                            list,
                        } as FilterResponseModel<ModelEntity>)
                )
            )
        ),
        TE.fold(
            (err) => {
                res.status(400);
                res.send(err);
                return T.never;
            },
            (result) => {
                res.send(result);
                return T.never;
            }
        )
    )();
};
