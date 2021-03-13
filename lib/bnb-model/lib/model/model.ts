import { createEmptyNode, ModelNode } from './node';
import { ModelUnit } from './unit';
import { generateRandomId, generateRandomName } from '../util/util';
import moment from 'moment';

export interface Model {
    id: string;
    name: string;
    node: ModelNode;
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

export const parseModelFromJSON = (source: string): Model => {
    return createEmptyModel();
};

export const createEmptyModel = (p?: { name: string; id: string }): Model => ({
    id: p?.id ?? generateRandomId(),
    name: p?.name ?? generateRandomName(),
    createdAt: moment().unix(),
    updatedAt: moment().unix(),
    node: createEmptyNode('_root'),
    units: [],
});
