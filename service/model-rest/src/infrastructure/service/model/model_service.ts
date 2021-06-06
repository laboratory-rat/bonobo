import { ModelCreateRequestModel, ModelCreateResponseModel } from '@/infrastructure/model/model';
import * as TE from '~/fp-ts/TaskEither';
import * as F from '~/fp-ts/function';
import * as E from '~/fp-ts/Either';
import { InputUnit, modelParseJSON, OutputUnit, validateModel } from '../../../../../../lib/bnb-model/lib/model';
import { createServiceError, ServiceError } from '@/infrastructure/error';
import { ModelEntity } from '@/infrastructure/entity/model_entity';
import moment from '~/moment/moment';
import { dbCountModelEntity, dbCreateModelEntity, dbDeleteModelEntity, dbFindModelEntity } from '@/infrastructure/repository/model_repository';
import { FilterRequestModel, FilterResponseModel } from '@/infrastructure/model/search';

export const modelCreate = (model: ModelCreateRequestModel): TE.TaskEither<ServiceError, ModelCreateResponseModel> =>
    F.pipe(
        model,
        E.fromNullable(createServiceError('MODEL_NULL', 'Model is required')),
        E.chain(({ json }) =>
            F.pipe(
                json,
                E.fromNullable(createServiceError('MODEL_BAD_MODEL', 'Json is required')),
                E.chain((json) =>
                    F.pipe(
                        json,
                        modelParseJSON,
                        E.chain(validateModel),
                        E.mapLeft((x) => createServiceError('MODEL_BAD_MODEL', x.message))
                    )
                )
            )
        ),

        TE.fromEither,
        TE.chain((bnbModel) => {
            const entity: ModelEntity = {
                _id: bnbModel.id,
                name: bnbModel.name,
                json: model.json,
                inputShape: bnbModel.units.filter((x) => x.type == '_input').map((x) => x as InputUnit)[0]!.options.shape,
                outputShape: bnbModel.units.filter((x) => x.type == '_output').map((x) => x as OutputUnit)[0]!.options.shape,
                createdTime: moment().unix(),
                updatedTime: moment().unix(),
            };

            return dbCreateModelEntity(entity);
        })
    );

const _validateAndMap = <TError, TRes>(map: (model: { skip: number; limit: number }, val: number) => TRes, val?: number) => (model: { skip: number; limit: number }): E.Either<TError, TRes> => F.pipe(val ? Math.max(0, val) : 0, (v) => E.right(map(model, v)));

export const modelFind = (skip?: number, limit?: number, filter?: FilterRequestModel<ModelEntity>): TE.TaskEither<ServiceError, FilterResponseModel<ModelEntity>> =>
    F.pipe(
        E.of({
            skip: 0,
            limit: 0,
        }),
        E.chain(_validateAndMap((m, skip) => ({ ...m, skip }), skip)),
        E.chain(_validateAndMap((m, limit) => ({ ...m, limit }), limit)),
        TE.fromEither,
        TE.chain(({ skip, limit }) =>
            F.pipe(
                dbFindModelEntity(skip, limit, filter),
                TE.map((list) => ({
                    skip,
                    limit,
                    list,
                }))
            )
        ),
        TE.chain(({ skip, limit, list }) =>
            F.pipe(
                dbCountModelEntity(filter?.search ?? {}),
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
        )
    );

export const modelDelete = (id: string): TE.TaskEither<ServiceError, unknown> => F.pipe(id, E.fromNullable(createServiceError('MODEL_NOT_FOUND', 'Id is required')), TE.fromEither, TE.chain(dbDeleteModelEntity));
