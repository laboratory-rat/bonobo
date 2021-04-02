import {
    BaseServiceError,
    createServiceError,
    ServiceError,
    ServiceErrorCode,
} from './index';

export type DatasetServiceError = BaseDatasetServiceError;
export type DatasetServiceErrorCode =
    | 'DOCUMENT_ID_NULL'
    | 'DOCUMENT_NOT_FOUND'
    | 'DOCUMENT_EMPTY'
    | 'PARSE_ERROR'
    | 'WRITE_FILE_ERROR'
    | 'READ_FILE_ERROR'
    | 'DELETE_FILE_ERROR'
    | 'DATASET_NOT_FOUND';

interface BaseDatasetServiceError extends BaseServiceError {
    spreadsheetId: string;
}

export const createDatasetServiceError = (
    spreadsheetId: string | null,
    code: ServiceErrorCode,
    message: string,
    inner?: ServiceError
): ServiceError => ({
    ...createServiceError(code, message, inner),
    spreadsheetId,
});
