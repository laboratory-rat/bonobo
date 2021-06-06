import { DatasetMetadataEntity } from '@/infrastructure/entity/dataset_metadata_entity';
import { connectMongoDb } from '@/connector/mongodb';
import * as TE from '~/fp-ts/TaskEither';
import { ServiceError } from '@/infrastructure/error';
import moment from '~/moment/moment';
import { FilterRequestModel } from '../model/search';

const _collection = 'db_metadata';

export const dbCreateDatasetMetadataEntity = (entity: DatasetMetadataEntity): TE.TaskEither<ServiceError, DatasetMetadataEntity> =>
    connectMongoDb(async (db) => {
        const result = await db.collection(_collection).insertMany([entity]);
        return entity;
    });

export const dbReadDatasetMetadataEntity = (id: string): TE.TaskEither<ServiceError, DatasetMetadataEntity> =>
    connectMongoDb(async (db) => {
        const result = (await db.collection(_collection).findOne({ id })) as DatasetMetadataEntity;
        return result;
    });

export const dbFindMetadataEntity = (skip: number, limit: number, filter: FilterRequestModel<DatasetMetadataEntity>): TE.TaskEither<ServiceError, DatasetMetadataEntity[]> =>
    connectMongoDb(async (db) => {
        const query = db.collection(_collection).find(filter.search ?? {});
        if (filter.sort) {
            query.sort(filter.sort, filter.desc ? -1 : 1);
        }

        const result = await query.skip(skip).limit(limit);
        return result.toArray();
    });

export const dbCountMetadataEntity = (search: Partial<DatasetMetadataEntity>): TE.TaskEither<ServiceError, number> =>
    connectMongoDb((db) => {
        return db.collection(_collection).count(search);
    });

export const dbUpdateMetadataEntity = (metadata: DatasetMetadataEntity): TE.TaskEither<ServiceError, DatasetMetadataEntity> =>
    connectMongoDb(async (db) => {
        metadata.updatedTime = moment().unix();
        const result = await db.collection(_collection).updateOne({ _id: metadata._id }, { $set: metadata });
        if (result.modifiedCount != 1) {
            throw 'Metadata not found by id ' + metadata._id;
        }

        return metadata;
    });

export const dbDeleteDatasetMetadataEntity = (id: string): TE.TaskEither<ServiceError, number> =>
    connectMongoDb(async (db) => {
        const result = await db.collection(_collection).deleteOne({ id });
        return result.deletedCount;
    });
