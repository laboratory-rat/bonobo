import { Db, MongoClient } from 'mongodb';
import { createDbConfig } from '../config/db';
import * as TE from '~/fp-ts/TaskEither';
import * as F from '~/fp-ts/function';
import * as E from '~/fp-ts/Either';
import { createServiceError, ServiceError } from '@/infrastructure/error';

export const connectMongoDb = <T>(
    fn: (c: Db) => Promise<T>
): TE.TaskEither<ServiceError, T> =>
    F.pipe(
        createDbConfig(),
        E.fromNullable(
            createServiceError('CONFIG_ERROR', 'Database config error')
        ),
        TE.fromEither,
        TE.chain((config) =>
            TE.tryCatch(
                async () => {
                    const client = new MongoClient(config.connectionString, {
                        useUnifiedTopology: true,
                    });
                    const connection = await client.connect();
                    const db = await connection.db(config.db);
                    return {
                        connection,
                        db,
                    };
                },
                (reason) =>
                    createServiceError('CONNECTION_ERROR', String(reason))
            )
        ),
        TE.chain(({ connection, db }) =>
            F.pipe(
                TE.tryCatch(
                    async () => {
                        const r = await fn(db);
                        await connection.close();
                        return r;
                    },
                    (err) => {
                        return createServiceError(
                            'UNEXPECTED_ERROR',
                            String(err)
                        );
                    }
                )
            )
        )
    );
