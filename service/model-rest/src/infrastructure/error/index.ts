export type ServiceError = BaseServiceError;

export interface BaseServiceError {
    code: number;
    message: string;
    inner?: ServiceError
};

export const createServiceError = (code: number, message: string, inner?: ServiceError): ServiceError => ({
    code,
    message,
    inner
})