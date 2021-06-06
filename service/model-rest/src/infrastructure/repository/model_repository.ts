import * as TE from '~/fp-ts/TaskEither';
import moment from '~/moment/moment';
import { ModelEntity } from '@/infrastructure/entity/model_entity';
import { ServiceError } from '@/infrastructure/error';
import { connectMongoDb } from '@/connector/mongodb';
import { Db } from 'mongodb';
import { FilterRequestModel } from '@/infrastructure/model/search';

const getCollection = (db: Db) => db.collection('model');
const now = (): number => moment().unix();

export const dbCreateModelEntity = (entity: ModelEntity): TE.TaskEither<ServiceError, ModelEntity> =>
    connectMongoDb(async (db) => {
        entity.createdTime = now();
        entity.updatedTime = now();
        const result = await getCollection(db).insertOne(entity);
        return entity;
    });

export const dbReadModelEntity = (id: string): TE.TaskEither<ServiceError, ModelEntity> =>
    connectMongoDb((db) => {
        return getCollection(db)
            .findOne({ id })
            .then((e) => e as ModelEntity);
    });

export const dbFindModelEntity = (skip: number, limit: number, model: FilterRequestModel<ModelEntity>): TE.TaskEither<ServiceError, ModelEntity[]> =>
    connectMongoDb((db) => {
        const query = getCollection(db).find(model.search ?? {});
        if (model.sort) {
            query.sort(model.sort, model.desc ? -1 : 1);
        }

        return query.skip(skip).limit(limit).toArray();
    });

export const dbCountModelEntity = (model: Partial<ModelEntity>): TE.TaskEither<ServiceError, number> =>
    connectMongoDb((db) =>
        getCollection(db)
            .find(model ?? {})
            .count()
    );

export const dbUpdateModelEntity = (entity: ModelEntity): TE.TaskEither<ServiceError, ModelEntity> =>
    connectMongoDb(async (db) => {
        entity.updatedTime = now();
        const result = await getCollection(db).updateOne({ _id: entity._id }, { $set: entity });
        if (result.matchedCount != 1) throw 'Model update error';
        return entity;
    });

export const dbDeleteModelEntity = (id: string): TE.TaskEither<ServiceError, number> =>
    connectMongoDb((db) =>
        getCollection(db)
            .deleteOne({ _id: id })
            .then((x) => x.deletedCount)
    );
