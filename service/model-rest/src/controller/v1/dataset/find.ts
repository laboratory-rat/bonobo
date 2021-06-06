import { Request, Response } from 'express';
import * as F from '~/fp-ts/function';
import * as TE from '~/fp-ts/TaskEither';
import * as T from '~/fp-ts/Task';
import { DatasetFilterModel, DatasetFindResponse } from '@/infrastructure/model/dataset';
import { dbCountMetadataEntity, dbFindMetadataEntity } from '@/infrastructure/repository/dataset_metadata_repository';
import { FilterRequestModel, FilterResponseModel } from '@/infrastructure/model/search';
import { DatasetMetadataEntity } from '@/infrastructure/entity/dataset_metadata_entity';

export default async (req: Request, res: Response) => {
    const skip = Math.max(parseInt(req.params['skip']) ?? 0, 0);
    const limit = Math.max(parseInt(req.params['limit']) ?? 1, 1);
    const filter = (req.body as FilterRequestModel<DatasetMetadataEntity>) ?? {
        sort: 'updatedTime',
        desc: true,
        search: {},
    };
    filter.search = {
        ...filter.search,
        isTemporary: false,
    };

    await F.pipe(
        dbFindMetadataEntity(skip, limit, filter),
        TE.chain((list) =>
            F.pipe(
                dbCountMetadataEntity(filter.search),
                TE.map(
                    (total) =>
                        ({
                            total,
                            limit,
                            skip,
                            list,
                        } as FilterResponseModel<DatasetMetadataEntity>)
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
