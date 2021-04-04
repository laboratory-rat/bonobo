import { ErrorTypeNode } from '../model/node';
import { ErrorTypeModel } from '../model/model';
import { ErrorTypeUnit } from '../model/unit';
import { ErrorTypeActivation } from '../model/activation';
import { ErrorTypeOptimizer } from '../model/optimizer';

export type ErrorType =
    | ErrorTypeModel
    | ErrorTypeTensor
    | ErrorTypeNode
    | ErrorTypeUnit
    | ErrorTypeActivation
    | ErrorTypeOptimizer;

export type ErrorTypeTensor =
    | 'TENSOR_TO_ARRAY_ERROR'
    | 'TENSOR_FROM_ARRAY_ERROR';

export interface ERR {
    type: ErrorType;
    message: string;
    innerError: ERR | null;
}

export const createError = (
    type: ErrorType,
    message: unknown,
    innerError?: ERR | null
): ERR => ({
    type: type,
    message: String(message),
    innerError: innerError || null,
});
