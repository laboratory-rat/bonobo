import { compileNode, createNode, deepCloneRootNode, flatNodeThree, ModelNode, parsePrepareNode, ReferenceNode, serializePrepareNode, StructureNode, validateNode } from './node';
import { ModelUnit, parsePrepareUnit, serializePrepareUnit, validateUnit } from './unit';
import { generateRandomId, generateRandomName } from '../util/util';
import moment from 'moment';
import { pipe } from 'fp-ts/function';
import { chain, Either, fromNullable, isLeft, Left, left, map, mapLeft, of, right, tryCatch } from 'fp-ts/Either';
import { createError, ERR } from '../error';
import { filter, head } from 'lodash';
import YAML from 'yaml';
import { TF } from '../connector';
import { compileOptimizer, createOptimizer, Optimizer, validateOptimizer } from './optimizer';
import { ModelNormalizeStrategy, TrainOptions } from '@lib/model/train_options';

export interface Model {
    id: string;
    name: string;
    root: ModelNode;
    units: ModelUnit[];
    createdAt: number;
    updatedAt: number;
}

export interface TrainResults {
    startedAt: number;
    finishedAt: number;
    epochsCount: number;
    finalScore: unknown;
}

export type ErrorTypeModel = 'MODEL_CREATE_ERROR' | 'MODEL_SERIALIZE_ERROR' | 'MODEL_PARSE_ERROR' | 'MODEL_CLONE_ERROR' | 'MODEL_VALIDATION_ERROR' | 'MODEL_COMPILE_ERROR' | 'MODEL_SPLIT_TO_LAYERS_ERROR' | 'MODEL_TRAIN_ERROR';

const _createError = (type: ErrorTypeModel, message: unknown, innerError?: ERR) => createError(type, message, innerError);

interface NodeShakeState {
    dependsToId: string | null;
    joinWithId: string[];
    node: ModelNode;
    compiled?: any;
}

const isNodeShakeStateReady = (map: Map<string, NodeShakeState>, nss: NodeShakeState): boolean => {
    if (nss.dependsToId && !map.get(nss.dependsToId)!.compiled) return false;
    if (nss.joinWithId && nss.joinWithId.length && nss.joinWithId.some((j) => !map.get(j)!.compiled)) return false;
    return true;
};

export const createEmptyModel = (p?: { name?: string; id?: string }): Either<ERR, Model> =>
    pipe(
        createNode({ type: '_root', parent: undefined }),
        mapLeft((err) => _createError('MODEL_CREATE_ERROR', 'See inner error', err)),
        chain((root) =>
            right({
                id: p?.id ?? generateRandomId(),
                name: p?.name ?? generateRandomName(),
                createdAt: moment().unix(),
                updatedAt: moment().unix(),
                root,
                units: [],
                optimizer: createOptimizer('_sgd'),
            })
        )
    );

export const modelParseJSON = (source: string): Either<ERR, Model> =>
    pipe(
        source?.trim(),
        fromNullable(_createError('MODEL_PARSE_ERROR', 'Source is empty or null')),
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
        fromNullable(_createError('MODEL_PARSE_ERROR', 'Source is empty or null')),
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
    };
    clone.root = deepCloneRootNode({ ...clone, parent: undefined });
    return clone;
};

const _validateId = (model: Model): Either<ERR, Model> => pipe(model.id, (x) => (!x || !x.trim().length ? left(createError('MODEL_VALIDATION_ERROR', 'Id is required')) : right(model)));

const _validateName = (model: Model): Either<ERR, Model> => pipe(model.name, (x) => (!x || !x.trim().length ? left(createError('MODEL_VALIDATION_ERROR', 'Name is required')) : right(model)));

const _validateRoot = (model: Model): Either<ERR, Model> =>
    pipe(
        model.root,
        fromNullable(createError('MODEL_VALIDATION_ERROR', 'Root node is required')),
        chain(validateNode),
        map((_) => model)
    );

const _validateNode = (node: ModelNode[]): Either<ERR, ModelNode[]> =>
    pipe(
        of<ERR, ModelNode[]>(node),
        chain((n) => {
            const rootsCount = filter(n, { type: '_root' }).length;
            if (rootsCount == 0) return left(createError('MODEL_VALIDATION_ERROR', 'Root node is required'));
            if (rootsCount > 1) return left(createError('MODEL_VALIDATION_ERROR', 'Root nodes can not be > 1'));
            return right(n);
        }),
        chain((n) => {
            const structCount = filter(n, { type: '_struct' }).length;
            if (!structCount) return left(createError('MODEL_VALIDATION_ERROR', 'No struct nodes found'));
            return right(n);
        }),
        chain((n) => {
            const innerValidation = head(filter(n.map(validateNode), (x) => x._tag == 'Left'));
            return innerValidation ? left(createError('MODEL_VALIDATION_ERROR', 'In node error', (innerValidation as Left<ERR>).left)) : right(n);
        })
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
                _validateNode(flatNodeThree(model.root)),
                map((_) => model)
            )
        ),
        chain((model) =>
            pipe(
                model.units,
                fromNullable(createError('MODEL_VALIDATION_ERROR', 'Units are required')),
                chain((units) => head(filter(units.map(validateUnit), isLeft)) ?? right(model))
            )
        )
    );

export const splitToLayers = (model: Model): Either<ERR, ModelNode[][]> =>
    pipe(
        model,
        fromNullable(_createError('MODEL_SPLIT_TO_LAYERS_ERROR', 'Model is null')),
        chain((model) => {
            if (!model.root) {
                return left(_createError('MODEL_SPLIT_TO_LAYERS_ERROR', 'Root is null'));
            }

            const splitRec = (node: ModelNode, currentIndex: number): Map<number, ModelNode[]> => {
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
                                            result.set(key, [...result.get(key), ...val]);
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

export const compileModel = (model: Model, optimizer: Optimizer): Either<ERR, TF.LayersModel> =>
    pipe(
        validateModel(model),
        chain((model) => {
            const _l = (message: unknown, inner?: ERR) => left(_createError('MODEL_COMPILE_ERROR', message, inner));

            const nodesList = flatNodeThree(model.root);
            nodesList.splice(0, 1);

            // set all struct nodes
            const nodesShakeList = new Map(
                filter(nodesList, { type: '_struct' })
                    .map((x) => x as StructureNode)
                    .map((node) => [
                        node.id,
                        {
                            dependsToId: node._unit!.type == '_input' ? null : node._parent!.id,
                            joinWithId: [],
                            node: node,
                        } as NodeShakeState,
                    ])
            );

            // add references
            filter(nodesList, { type: '_reference' })
                .map((x) => x as ReferenceNode)
                .forEach((node) => {
                    nodesShakeList.get(node.nodeId)!.joinWithId.push(node._parent!.id);
                });

            // shake until all will be ok
            let lastStepCompiledCount = 0;
            while (lastStepCompiledCount != nodesShakeList.size) {
                [...nodesShakeList.values()]
                    .filter((x) => !x.compiled && isNodeShakeStateReady(nodesShakeList, x))
                    .forEach((readyNode) => {
                        let compiledResult = compileNode(readyNode.node, readyNode.dependsToId ? nodesShakeList.get(readyNode.dependsToId)!.compiled : undefined);

                        // TODO: F-bombs distribution here. I do not have a fuck what is happening here!
                        while (compiledResult._tag) {
                            if (compiledResult._tag == 'Left') {
                                return left(compiledResult);
                            }

                            compiledResult = compiledResult.right;
                        }

                        readyNode.compiled = compiledResult;
                        if (readyNode.joinWithId.length) {
                            readyNode.compiled = TF.layers.concatenate().apply([readyNode.compiled, ...readyNode.joinWithId.map((id) => nodesShakeList.get(id)!.compiled)]);
                        }
                    });

                const currentStepCompiledCount = [...nodesShakeList.values()].filter((x) => x.compiled).length;
                if (currentStepCompiledCount == lastStepCompiledCount) {
                    return _l('Model can not resolve nodes three');
                }

                lastStepCompiledCount = currentStepCompiledCount;
            }

            return right(
                TF.model({
                    inputs: [...nodesList.filter((x) => x.type == '_struct' && x._unit!.type == '_input').map((x) => nodesShakeList.get(x.id)!.compiled)],
                    outputs: [...nodesList.filter((x) => x.type == '_struct' && x._unit!.type == '_output').map((x) => nodesShakeList.get(x.id)!.compiled)],
                })
            );
        }),
        chain((tfModel) =>
            pipe(
                optimizer,
                fromNullable(_createError('MODEL_COMPILE_ERROR', 'Optimizer is null')),
                chain(validateOptimizer),
                chain(compileOptimizer),
                chain((optimizer) =>
                    tryCatch(
                        () => {
                            tfModel.compile({
                                optimizer,
                                metrics: ['accuracy'],
                                loss: 'categoricalCrossentropy',
                            });

                            return tfModel;
                        },
                        (reason) => _createError('MODEL_COMPILE_ERROR', reason)
                    )
                )
            )
        )
    );

const _checkTrainModelArgument = <TItem, TResult>(item: TItem, argumentName: string, callback: (TItem) => TResult): Either<ERR, TResult> => pipe(item, fromNullable(_createError('MODEL_TRAIN_ERROR', `Argument ${argumentName} is null`)), map(callback));

export const trainModel = (props: { model: TF.LayersModel; optimizer: Optimizer; options: TrainOptions; input: (number | string)[][][]; label: (number | string)[][][] }): unknown =>
    pipe(
        _checkTrainModelArgument<TF.LayersModel, { model: TF.LayersModel }>(props.model, 'model', (model: TF.LayersModel) => ({ model })),
        chain((payload) => _checkTrainModelArgument<Optimizer, { model: TF.LayersModel; optimizer: Optimizer }>(props.optimizer, 'optimizer', (optimizer: Optimizer) => ({ optimizer, ...payload }))),
        chain((payload) => _checkTrainModelArgument<TrainOptions, { model: TF.LayersModel; optimizer: Optimizer; trainOptions: TrainOptions }>(props.options, 'train options', (trainOptions) => ({ trainOptions, ...payload }))),
        chain((payload) => _checkTrainModelArgument<(number | string)[][][], { model: TF.LayersModel; optimizer: Optimizer; trainOptions: TrainOptions; input: (number | string)[][][] }>(props.input, 'input', (input) => ({ input, ...payload }))),
        chain((payload) => _checkTrainModelArgument<(number | string)[][][], { model: TF.LayersModel; optimizer: Optimizer; trainOptions: TrainOptions; input: (number | string)[][][]; label: (number | string)[][][] }>(props.label, 'label', (label) => ({ label, ...payload }))),
        chain(({ model, optimizer, trainOptions, input, label }) => {})
    );
