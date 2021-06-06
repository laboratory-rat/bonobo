import { Db } from 'mongodb';
import moment from '~/moment/moment';
import { ModelVersionEntity } from '@/infrastructure/entity/model_version_entity';
import * as TE from '~/fp-ts/TaskEither';
import { ServiceError } from '@/infrastructure/error';
import { connectMongoDb } from '@/connector/mongodb';

const getCollection = (db: Db) => db.collection('model_version');
const now = (): number => moment().unix();

export const dbCreateModelVersionEntity = (entity: ModelVersionEntity): TE.TaskEither<ServiceError, ModelVersionEntity> =>
    connectMongoDb(async (db) => {
        entity.updatedTime = now();
        entity.createdTime = now();
        const result = await getCollection(db).insertOne(entity);
        return entity;
    });

export const dbFindModelVersionEntityByModelId = (modelId: string): TE.TaskEither<ServiceError, ModelVersionEntity[]> =>
    connectMongoDb((db) =>
        getCollection(db)
            .find({ modelId } as Partial<ModelVersionEntity>)
            .toArray()
    );

export const dbUpdateModelVersionEntity = (entity: ModelVersionEntity): TE.TaskEither<ServiceError, ModelVersionEntity> =>
    connectMongoDb(async (db) => {
        entity.updatedTime = now();
        const result = await getCollection(db).updateOne({ _id: entity._id }, { $set: entity });
        if (result.modifiedCount != 1) throw 'Can not update model version';
        return entity;
    });

export const dbDeleteModelVersionEntity = (id: string): TE.TaskEither<ServiceError, number> =>
    connectMongoDb((db) =>
        getCollection(db)
            .deleteOne({ id })
            .then((x) => x.deletedCount)
    );
