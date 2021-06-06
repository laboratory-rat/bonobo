import { ModelVersionCreateModel, ModelVersionDisplayModel } from '@/infrastructure/model/model';
import * as F from '~/fp-ts/function';
import * as E from '~/fp-ts/Either';
import * as TE from '~/fp-ts/TaskEither';
import { createServiceError, ServiceError } from '@/infrastructure/error';
import { dbCountModelEntity } from '@/infrastructure/repository/model_repository';
import {Optimizer, validateOptimizer} from '~/bnb-model/lib';
import {ModelVersionEntity} from "@/infrastructure/entity/model_version_entity";
import {v4} from "uuid";
import moment from "~/moment/moment";

export const modelVersionCreate = (modelId: string, model: ModelVersionCreateModel): TE.TaskEither<ServiceError, ModelVersionDisplayModel> =>
    F.pipe(
        model,
        E.fromNullable(createServiceError('MODEL_NULL', 'Model is null')),
        E.chain((model) =>
            F.pipe(
                modelId,
                E.fromNullable(createServiceError('MODEL_NULL', 'Model id is required')),
                E.map((modelId) => ({ modelId, model }))
            )
        ),
        TE.fromEither,
        TE.chain((data) => F.pipe(dbCountModelEntity({ _id: modelId }), TE.chain(response => response !== 1 ? TE.left(createServiceError('MODEL_BAD_MODEL', `Model with id ${modelId} is not found`)) : TE.right(data)))),
        TE.chain(({modelId, model}) => F.pipe(
            JSON.parse(model.json) as Optimizer,
            validateOptimizer,
            E.mapLeft(err => createServiceError('MODEL_BAD_MODEL', err.message)),
            E.map(optimizer => ({
                modelId,
                _id: v4(),
                updatedTime: moment().unix(),
                createdTime: moment().unix(),
                version: 1,
                isStarted: false,
                isFinished: false,
                optimizerJson: model.json,
            }) as ModelVersionEntity) // TODO: Add here rest of fields!.
            E.map(optimizer => ({
                optimizer,
                modelId
            })),

            TE.fromEither,
        )),
        TE.chain()
    );
