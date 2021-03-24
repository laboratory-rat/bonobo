import { ModelUnit, validateUnit } from './unit';
import { generateRandomId, generateRandomName } from '../util/util';
import { filter, head, remove } from 'lodash';
import {
    chain,
    Either,
    fold,
    fromNullable,
    isLeft,
    Left,
    map,
    of,
    right,
} from 'fp-ts/Either';
import { ERR } from '../error';
import { pipe } from 'fp-ts/function';
import { left } from 'fp-ts/Either';
import { LayerChainType } from '@lib/util/types';
import { TF } from '../connector';

export type ModelNode = RootNode | StructureNode | ReferenceNode;

export type ModelNodeType = '_root' | '_struct' | '_reference';

export type ErrorTypeNode =
    | 'NODE_CREATE_ERROR'
    | 'NODE_ADD_ERROR'
    | 'NODE_REMOVE_ERROR'
    | 'NODE_RESTORE_ERROR'
    | 'NODE_JSON_PREPARE_ERROR'
    | 'NODE_VALIDATION_ERROR'
    | 'NODE_APPLY_ERROR'
    | 'NODE_APPLY_NODE_ERROR'
    | 'NODE_UNDEFINED_ERROR';

const _createError = (
    type: ErrorTypeNode,
    message: string,
    inner?: ERR
): ERR => ({
    type,
    message,
    innerError: inner || null,
});

interface BaseNode {
    id: string;
    type: ModelNodeType;
    name: string;
}

export interface RootNode extends BaseNode {
    type: '_root';
    childrenCount: number;
    children: ModelNode[];
}

export interface StructureNode extends BaseNode {
    type: '_struct';
    unitId: string;
    _unit?: ModelUnit;
    _parent?: ModelNode;
    childrenCount: number;
    children: ModelNode[];
}

export interface ReferenceNode extends BaseNode {
    type: '_reference';
    nodeId: string;
    _parent?: ModelNode;
    _node?: ModelNode;
}

/// Creates empty node with selected type
export const createNode = (payload: {
    type: ModelNodeType;
    parent?: ModelNode;
    id?: string;
    name?: string;
}): Either<ERR, ModelNode> =>
    pipe(
        payload,
        fromNullable(
            _createError(
                'NODE_CREATE_ERROR',
                'Create node called with empty payload'
            )
        ),
        chain(({ type, parent, id, name }) => {
            if (type != '_root' && !parent) {
                return left(
                    _createError(
                        'NODE_CREATE_ERROR',
                        'No parent set for non root node'
                    )
                );
            }

            id ??= generateRandomId();
            name ??= generateRandomName();

            switch (type) {
                case '_root':
                    return right({
                        id,
                        name,
                        type,
                        children: [],
                        childrenCount: 0,
                    } as ModelNode);
                case '_struct':
                    return right({
                        id,
                        name,
                        type,
                        unitId: '',
                        _parent: parent,
                        children: [],
                        childrenCount: 0,
                    } as ModelNode);
                case '_reference':
                    return right({
                        id,
                        name,
                        type,
                        nodeId: '',
                        _parent: parent,
                    } as ModelNode);
                default:
                    return left(
                        _createError('NODE_ADD_ERROR', 'Unknown node type')
                    );
            }
        }),
        chain((node) => {
            const { parent } = payload;
            if (parent) {
                if (parent.type == '_reference') {
                    return left(
                        _createError(
                            'NODE_ADD_ERROR',
                            'Can not add node to reference node'
                        )
                    );
                }

                parent.children = parent.children ?? [];
                parent.children.push(node);
                parent.childrenCount++;
            }

            return right(node);
        })
    );

export const getRootByNode = (node: ModelNode): ModelNode => {
    if (node.type == '_root' || node._parent == null) {
        return node;
    }

    return getRootByNode(node._parent);
};

export const addNodeToModel = (
    parent: ModelNode
): ((node: ModelNode) => Either<ERR, ModelNode>) => (node: ModelNode) =>
    pipe(
        parent,
        fromNullable(_createError('NODE_ADD_ERROR', 'Payload is null')),
        chain((parent) => {
            const root = getRootByNode(parent);
            if (!parent) {
                return left(
                    _createError('NODE_ADD_ERROR', 'Parent node is null')
                );
            }

            if (parent.type == '_reference') {
                return left(
                    _createError(
                        'NODE_ADD_ERROR',
                        'Can not add node to reference typed parent'
                    )
                );
            }

            if (!node) {
                return left(_createError('NODE_ADD_ERROR', 'Node is null'));
            }

            if (!parent.children) {
                parent.children = [];
            }

            switch (node.type) {
                case '_root': {
                    return left(
                        _createError(
                            'NODE_ADD_ERROR',
                            'Child node can not be root type'
                        )
                    );
                }
                case '_reference': {
                    if (node.nodeId && node.nodeId.trim().length) {
                        node._node =
                            head(
                                filter(
                                    flatNodeThree(root),
                                    (x) => x.id == node.nodeId
                                )
                            ) ?? undefined;
                    }
                    break;
                }
                default:
                    break;
            }

            if (parent.children) {
                parent.children.push(node);
            } else {
                parent.children = [node];
            }

            return right(node);
        })
    );

export const removeNodeFromModel = (payload: {
    units: ModelUnit[];
    node: ModelNode;
}): Either<ERR, { units: ModelUnit[]; node: ModelNode }> =>
    pipe(
        payload,
        fromNullable(
            _createError(
                'NODE_REMOVE_ERROR',
                'Node remove called with no payload'
            )
        ),
        chain(({ units, node }) => {
            const _l = (message: string): Either<ERR, never> =>
                left(_createError('NODE_REMOVE_ERROR', message));
            if (node.type == '_root') {
                return _l('Can not remove root node');
            }

            if (!node._parent) {
                return _l('Parent node is null. Node three is damaged');
            }

            const unitsToRemove = filter(flatNodeThree(node), {
                type: '_struct',
            }).map((x) => (x as StructureNode).unitId);
            const newUnitsList = filter(
                units,
                (x) => unitsToRemove.indexOf(x.id) == -1
            );
            remove((node._parent as RootNode | StructureNode).children, node);
            return right({ node, units: newUnitsList });
        })
    );

export const deepCloneRootNode = (payload: {
    units: ModelUnit[];
    root: ModelNode;
    parent?: ModelNode;
}): ModelNode => {
    const { units, root, parent } = payload;

    switch (root.type) {
        case '_root':
            return _rootRelinkUnitsAndNodes({
                root: {
                    ...root,
                    type: '_root',
                    children:
                        root.children?.map((childrenNode) =>
                            deepCloneRootNode({
                                units,
                                root: childrenNode,
                                parent: root,
                            })
                        ) ?? [],
                },
                units,
            });
        case '_struct':
            return {
                ...root,
                type: '_struct',
                _parent: parent,
                children:
                    root.children?.map((x) =>
                        deepCloneRootNode({ units, root: x, parent: root })
                    ) ?? [],
            };
        case '_reference':
            return {
                ...root,
                type: '_reference',
                _parent: parent,
            };
    }
};

export const applyUnitToNode = (
    node: ModelNode
): ((unit: ModelUnit) => Either<ERR, ModelNode>) => (
    unit: ModelUnit
): Either<ERR, ModelNode> =>
    pipe(
        node,
        fromNullable(_createError('NODE_APPLY_ERROR', 'Node is null')),
        chain((node) =>
            pipe(
                unit,
                fromNullable(_createError('NODE_APPLY_ERROR', 'Unit is null')),
                map((unit) => ({ unit, node }))
            )
        ),
        chain((pair) => {
            switch (pair.node.type) {
                case '_struct':
                    pair.node._unit = pair.unit;
                    pair.node.unitId = pair.unit.id;
                    return validateNode(pair.node);
                default:
                    return left(
                        _createError(
                            'NODE_APPLY_ERROR',
                            'Apply unit is unsupported for this node type'
                        )
                    );
            }
        })
    );

export const applyNodeToNode = (
    link: ModelNode
): ((node: ModelNode) => Either<ERR, ModelNode>) => (
    node: ModelNode
): Either<ERR, ModelNode> =>
    pipe(
        node,
        fromNullable(_createError('NODE_APPLY_NODE_ERROR', 'Node is null')),
        chain((node) => {
            if (node.type != '_reference') {
                return left(
                    _createError(
                        'NODE_APPLY_NODE_ERROR',
                        'Apply available only for reference nodes'
                    )
                );
            }

            node.nodeId = link.id;
            node._node = link;
            return right(node);
        })
    );

export const flatNodeThree = (node: ModelNode): ModelNode[] => {
    if (!node) {
        return [];
    }

    let result: ModelNode[] = [node];

    switch (node.type) {
        case '_root':
        case '_struct': {
            if (node.children && node.children.length) {
                result = result.concat(...node.children.map(flatNodeThree));
            }
            break;
        }
        default:
            break;
    }

    return result;
};

export const serializePrepareNode = (node: ModelNode): ModelNode => {
    switch (node.type) {
        case '_root':
            return {
                ...node,
                type: '_root',
                children: node.children?.map(serializePrepareNode) ?? [],
            };
        case '_reference':
            return {
                ...node,
                type: '_reference',
                _parent: undefined,
                _node: undefined,
            };
        case '_struct':
            return {
                ...node,
                type: '_struct',
                _parent: undefined,
                _unit: undefined,
                children: node.children?.map(serializePrepareNode) ?? [],
            };
    }

    return node;
};

export const parsePrepareNode = (payload: {
    units: ModelUnit[];
    root: ModelNode;
    parent?: ModelNode;
}): ModelNode => {
    const { units, root, parent } = payload;
    switch (root.type) {
        case '_root':
            return _rootRelinkUnitsAndNodes({
                root: {
                    ...root,
                    type: '_root',
                    children:
                        root.children?.map((child) =>
                            parsePrepareNode({
                                root: child,
                                units,
                                parent: root,
                            })
                        ) ?? [],
                },
                units,
            });
        case '_reference':
            return {
                ...root,
                type: '_reference',
                _parent: parent,
                _node: undefined,
            };
        case '_struct':
            return {
                ...root,
                type: '_struct',
                _unit: undefined,
                _parent: parent,
                children:
                    root.children?.map((child) =>
                        parsePrepareNode({
                            root: child,
                            units,
                            parent: root,
                        })
                    ) ?? [],
            };
    }

    return root;
};

const _rootRelinkUnitsAndNodes = (payload: {
    units: ModelUnit[];
    root: RootNode;
}): RootNode => {
    const { units, root } = payload;
    if (root.children && root.children.length && units && units.length) {
        flatNodeThree(root).forEach((node, _, arr) => {
            switch (node.type) {
                case '_struct':
                    node._unit =
                        head(filter(units, (x) => x.id == node.unitId)) ??
                        undefined;
                    break;
                case '_reference':
                    node._node =
                        head(filter(arr, (x) => x.id == node.nodeId)) ??
                        undefined;
                    break;
            }
        });
    }

    return root;
};

const _lNodeValidation = (m: string, inner?: ERR): Either<ERR, never> =>
    left(_createError('NODE_VALIDATION_ERROR', m, inner));

const _validateNodeId = <T extends ModelNode>(
    node: ModelNode
): Either<ERR, T> =>
    pipe(node.id, (id) =>
        !id || !id.trim().length
            ? _lNodeValidation('Id is required')
            : right(node as T)
    );

const _validateNodeName = <T extends ModelNode>(
    node: ModelNode
): Either<ERR, T> =>
    pipe(node.name, (id) =>
        !id || !id.trim().length
            ? _lNodeValidation('Name is required')
            : right(node as T)
    );

const _validateRootChildren = (node: RootNode): Either<ERR, RootNode> =>
    pipe(node.children, (x) =>
        !x || !x.length
            ? _lNodeValidation('Root node require children')
            : right(node)
    );

const _validateStructUnitId = (
    node: StructureNode
): Either<ERR, StructureNode> =>
    pipe(node.unitId, (x) =>
        !x || !x.trim().length
            ? _lNodeValidation('Unit id is null')
            : right(node)
    );

const _validateStructUnit = (node: StructureNode): Either<ERR, StructureNode> =>
    pipe(node._unit, (x) =>
        !x ? _lNodeValidation('Unit is null. Node damaged') : right(node)
    );

const _validateStructParent = (
    node: StructureNode
): Either<ERR, StructureNode> =>
    pipe(node._parent, (x) =>
        !x ? _lNodeValidation('Parent is null. Node damaged') : right(node)
    );

const _validateReferenceNodeId = (
    node: ReferenceNode
): Either<ERR, ReferenceNode> =>
    pipe(node.nodeId, (x) =>
        !x || !x.trim().length
            ? _lNodeValidation('Node id is required')
            : right(node)
    );
const _validateReferenceNode = (
    node: ReferenceNode
): Either<ERR, ReferenceNode> =>
    pipe(node._node, (x) =>
        !x ? _lNodeValidation('Reference node is required') : right(node)
    );
const _validateReferenceParent = (
    node: ReferenceNode
): Either<ERR, ReferenceNode> =>
    pipe(node._parent, (x) =>
        !x ? _lNodeValidation('Parent is required. Node damaged') : right(node)
    );

const _validateNodeChildren = (node: {
    children: ModelNode[];
}): Either<ERR, unknown> =>
    pipe(
        node.children,
        (x) => of<ERR, ModelNode[]>(x),
        chain((x) =>
            x && x.length
                ? head(filter(x.map(validateNode), isLeft)) ?? right(null)
                : right(null)
        )
    );

export const validateNode = (node: ModelNode): Either<ERR, ModelNode> =>
    pipe(
        node,
        fromNullable(_createError('NODE_VALIDATION_ERROR', 'Node is null')),
        chain((node) =>
            pipe(
                node,
                of,
                chain(_validateNodeId),
                chain(_validateNodeName),
                chain((node) => {
                    switch (node.type) {
                        case '_root':
                            return pipe(
                                node,
                                (x) => of<ERR, RootNode>(x),
                                chain(_validateNodeChildren)
                            );
                        case '_struct':
                            return pipe(
                                node,
                                (x) => of<ERR, StructureNode>(x),
                                chain(_validateStructUnitId),
                                chain(_validateStructUnit),
                                chain(_validateStructParent),
                                chain(_validateNodeChildren)
                            );
                        case '_reference':
                            return pipe(
                                node,
                                (x) => of<ERR, ReferenceNode>(x),
                                chain(_validateReferenceNodeId),
                                chain(_validateReferenceNode),
                                chain(_validateReferenceParent)
                            );
                        default:
                            return _lNodeValidation('Unknown node type');
                    }
                }),
                map((x) => x as ModelNode)
            )
        )
    );

export const compileUnit = (
    unit: ModelUnit
): Either<ERR, LayerChainType | TF.layers.Layer> => pipe();
