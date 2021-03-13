export type ErrorType = ErrorTypeModel | ErrorTypeTensor;

export type ErrorTypeModel = ''

export type ErrorTypeTensor = 'TENSOR_TO_ARRAY_ERROR' | 'TENSOR_FROM_ARRAY_ERROR';

export interface ERR {
    type: ErrorType;
    message: string;
}

export const createError = (type: ErrorType, message: unknown): ERR => ({
    type: type,
    message: message.toString(),
});