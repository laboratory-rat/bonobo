import { ModelUnit } from './unit';
import { generateRandomId, generateRandomName } from '../util/util';

export type ModelNode = RootNode | StructureNode | ReferenceNode;

export type ModelNodeType = '_root' | '_struct' | '_reference';

interface BaseNode {
    id: string;
    type: ModelNodeType;
    name: string;
}

export interface RootNode extends BaseNode {
    type: '_root';
    children: ModelNode[];
}

export interface StructureNode extends BaseNode {
    type: '_struct';
    unitId: string;
    _unit: ModelUnit | null;
    children: ModelNode[];
    childrenCount: number;
}

export interface ReferenceNode extends BaseNode {
    type: '_reference';
    nodeId: string;
    _node: ModelNode | null;
}

/// Creates empty node with selected type
export const createEmptyNode = (type: ModelNodeType): ModelNode => {
    const id = generateRandomId();
    const name = generateRandomName();
    switch (type) {
        case '_root':
            return {
                id,
                name,
                type,
                children: [],
            };
        case '_struct':
            return {
                id,
                name,
                type,
                unitId: '',
                _unit: null,
                children: [],
                childrenCount: 0,
            };
        case '_reference':
        default:
            return {
                id,
                name,
                type,
                nodeId: '',
                _node: null,
            };
    }
};
