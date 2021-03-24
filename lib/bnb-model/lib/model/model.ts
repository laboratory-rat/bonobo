import {
    createNode,
    deepCloneRootNode,
    parsePrepareNode,
    ModelNode,
    serializePrepareNode,
    validateNode,
} from './node';
import {
    parsePrepareUnit,
    ModelUnit,
    serializePrepareUnit,
    validateUnit,
} from './unit';
import { generateRandomId, generateRandomName } from '../util/util';
import moment from 'moment';
import { pipe } from 'fp-ts/function';
import {
    chain,
    Either,
    fromNullable,
    isLeft,
    left,
    map,
    mapLeft,
    right,
    tryCatch,
} from 'fp-ts/Either';
import { createError, ERR } from '../error';
import { head, filter } from 'lodash';
import YAML from 'yaml';

export interface Model {
    id: string;
    name: string;
    root: ModelNode;
    units: ModelUnit[];
    trainResults?: TrainResults;
    createdAt: number;
    updatedAt: number;
}

export interface TrainResults {
    startedAt: number;
    finishedAt: number;
    epochsCount: number;
    finalScore: unknown;
}

export type ErrorTypeModel =
    | 'MODEL_CREATE_ERROR'
    | 'MODEL_SERIALIZE_ERROR'
    | 'MODEL_PARSE_ERROR'
    | 'MODEL_CLONE_ERROR'
    | 'MODEL_VALIDATION_ERROR'
    | 'MODEL_SPLIT_TO_LAYERS_ERROR';

const _createError = (
    type: ErrorTypeModel,
    message: unknown,
    innerError?: ERR
) => createError(type, message, innerError);

export const createEmptyModel = (p?: {
    name?: string;
    id?: string;
}): Either<ERR, Model> =>
    pipe(
        createNode({ type: '_root', parent: undefined }),
        mapLeft((err) =>
            _createError('MODEL_CREATE_ERROR', 'See inner error', err)
        ),
        chain((root) =>
            right({
                id: p?.id ?? generateRandomId(),
                name: p?.name ?? generateRandomName(),
                createdAt: moment().unix(),
                updatedAt: moment().unix(),
                root,
                units: [],
            })
        )
    );

export const modelParseJSON = (source: string): Either<ERR, Model> =>
    pipe(
        source?.trim(),
        fromNullable(
            _createError('MODEL_PARSE_ERROR', 'Source is empty or null')
        ),
        chain((source) =>
            tryCatch(
                () => {
                    const model = JSON.parse(source) as Model;
                    model.units = model.units?.map(parsePrepareUnit);
                    model.root = parsePrepareNode({
                        ...model,
                        parent: undefined,
                    });
                    return model;
                },
                (reason) => _createError('MODEL_PARSE_ERROR', reason)
            )
        )
    );

export const modelSerializeJSON = (model: Model): Either<ERR, string> => {
    const clone = deepCloneModel(model);
    clone.units = clone.units?.map(serializePrepareUnit);
    clone.root = serializePrepareNode(clone.root);
    return right(JSON.stringify(clone));
};

export const modelSerializeYAML = (model: Model): Either<ERR, string> => {
    const clone = deepCloneModel(model);
    clone.units = clone.units?.map(serializePrepareUnit);
    clone.root = serializePrepareNode(clone.root);
    return right(YAML.stringify(clone));
};

export const modelParseYAML = (source: string): Either<ERR, Model> =>
    pipe(
        source?.trim(),
        fromNullable(
            _createError('MODEL_PARSE_ERROR', 'Source is empty or null')
        ),
        chain((source) =>
            tryCatch(
                () => {
                    const model = YAML.parse(source) as Model;
                    model.units = model.units?.map(parsePrepareUnit);
                    model.root = parsePrepareNode({
                        ...model,
                        parent: undefined,
                    });
                    return model;
                },
                (reason) => _createError('MODEL_PARSE_ERROR', reason)
            )
        )
    );

export const deepCloneModel = (model: Model): Model => {
    const cloneUnit = (unit: ModelUnit): ModelUnit => ({
        ...unit,
    });

    const clone: Model = {
        ...model,
        units: model.units ? model.units.map(cloneUnit) : [],
        trainResults: model.trainResults
            ? { ...model.trainResults }
            : undefined,
    };
    clone.root = deepCloneRootNode({ ...clone, parent: undefined });
    return clone;
};

const _validateId = (model: Model): Either<ERR, Model> =>
    pipe(model.id, (x) =>
        !x || !x.trim().length
            ? left(createError('MODEL_VALIDATION_ERROR', 'Id is required'))
            : right(model)
    );

const _validateName = (model: Model): Either<ERR, Model> =>
    pipe(model.name, (x) =>
        !x || !x.trim().length
            ? left(createError('MODEL_VALIDATION_ERROR', 'Name is required'))
            : right(model)
    );

const _validateRoot = (model: Model): Either<ERR, Model> =>
    pipe(
        model.root,
        fromNullable(
            createError('MODEL_VALIDATION_ERROR', 'Root node is required')
        ),
        chain(validateNode),
        map((_) => model)
    );

export const validateModel = (model: Model): Either<ERR, Model> =>
    pipe(
        model,
        fromNullable(createError('MODEL_VALIDATION_ERROR', 'Model is null')),
        chain(_validateId),
        chain(_validateName),
        chain(_validateRoot),
        chain((model) =>
            pipe(
                model.units,
                fromNullable(
                    createError('MODEL_VALIDATION_ERROR', 'Units are required')
                ),
                chain(
                    (units) =>
                        head(filter(units.map(validateUnit), isLeft)) ??
                        right(model)
                )
            )
        )
    );

export const splitToLayers = (model: Model): Either<ERR, ModelNode[][]> =>
    pipe(
        model,
        fromNullable(
            _createError('MODEL_SPLIT_TO_LAYERS_ERROR', 'Model is null')
        ),
        chain((model) => {
            if (!model.root) {
                return left(
                    _createError('MODEL_SPLIT_TO_LAYERS_ERROR', 'Root is null')
                );
            }

            const splitRec = (
                node: ModelNode,
                currentIndex: number
            ): Map<number, ModelNode[]> => {
                const result = new Map();

                if (node.type != '_root') {
                    result.set(currentIndex, [node]);
                }

                switch (node.type) {
                    case '_root':
                    case '_struct':
                        if (node.children && node.children.length) {
                            node.children
                                .map((x) => splitRec(x, currentIndex + 1))
                                .forEach((innerMap, value) => {
                                    innerMap.forEach((val, key) => {
                                        if (!result.has(key)) {
                                            result.set(key, val);
                                        } else {
                                            result.set(key, [
                                                ...result.get(key),
                                                ...val,
                                            ]);
                                        }
                                    });
                                });
                        }
                }

                return result;
            };

            const fullMap = splitRec(model.root, -1);
            const arr = [] as ModelNode[][];
            for (const [key, val] of fullMap) {
                if (key > -1) {
                    arr[key] = val;
                }
            }

            return right(arr);
        })
    );
