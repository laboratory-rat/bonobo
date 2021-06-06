import { DatasetServiceError, DatasetServiceErrorCode } from './dataset_service_error';
import { DatabaseServiceErrorCode } from '@/infrastructure/error/database_error';
import { ModelServiceErrorCode } from './model_error';

export type ServiceError = BaseServiceError | DatasetServiceError;
export type BaseServiceErrorCode = 'BAD_MODEL' | 'UNEXPECTED_ERROR';
export type ServiceErrorCode = BaseServiceErrorCode | DatasetServiceErrorCode | DatabaseServiceErrorCode | ModelServiceErrorCode;

export interface BaseServiceError {
    code: ServiceErrorCode;
    message: string;
    inner?: ServiceError;
}

export const createServiceError = (code: ServiceErrorCode, message: string, inner?: ServiceError): ServiceError => ({
    code,
    message,
    inner,
});
