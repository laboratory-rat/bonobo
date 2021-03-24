import { ErrorTypeNode } from '@lib/model/node';
import { ErrorTypeModel } from '@lib/model/model';
import { ErrorTypeUnit } from '@lib/model/unit';
import { ErrorTypeActivation } from '@lib/model/activation';
import { ErrorTypeOptimizer } from '@lib/model/optimizer';

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
