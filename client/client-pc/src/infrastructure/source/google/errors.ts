import * as ERROR from '@/infrastructure/core/Error';

export enum EnumSourceGoogleErrors {
  validation = 'SOURCE_GOOGLE_VALIDATION',
  parse = 'SOURCE_GOOGLE_PARSE',
  read = 'SOURCE_GOOGLE_READ'
}

export const createSourceGoogleError = (type: EnumSourceGoogleErrors, info: { error?: string; message?: string }) =>
  ERROR.createAppError({
    code: type,
    error: info?.error,
    message: info?.message
  });