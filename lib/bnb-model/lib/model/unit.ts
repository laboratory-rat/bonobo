import { generateRandomId } from '../util/util';

export type ModelUnit =
    | InputUnit
    | SequentialUnit
    | RecurrentUnit
    | TransformUnit
    | OutputUnit;

export type ModelType =
    | '_input'
    | '_sequential'
    | '_recurrent'
    | '_transform'
    | '_output';

interface BaseUnit {
    id: string;
    type: ModelType;
}

export interface InputUnit extends BaseUnit {
    type: '_input';
    shape: number[];
}

export interface SequentialUnit extends BaseUnit {
    type: '_sequential';
    shape: number[];
}

export interface RecurrentUnit extends BaseUnit {
    type: '_recurrent';
}

export interface TransformUnit extends BaseUnit {
    type: '_transform';
}

export interface OutputUnit extends BaseUnit {
    type: '_output';
}

export const createEmptyUnit = (type: ModelType, id?: string): ModelUnit => {
    const _id = id ?? generateRandomId();
    switch (type) {
        case '_input':
            return {
                id: _id,
                type,
                shape: [1, 1],
            };
        case '_sequential':
            return {
                id: _id,
                type,
                shape: [1, 1],
            };
        case '_recurrent':
            return {
                id: _id,
                type,
            };
        case '_transform':
            return {
                id: _id,
                type,
            };
        case '_output':
        default:
            return {
                id: _id,
                type: '_output',
            };
    }
};
