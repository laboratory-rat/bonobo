import { Model } from './model';

export const __ = (key: string, value: unknown): unknown =>
    key && key.trim().length && !key.startsWith('_') ? value : undefined;

export const serializeModelJSON = (model: Model): string | null => {
    return null;
};

export const deserializeModelJSON = (source: string): Model | null => {
    return null;
};
