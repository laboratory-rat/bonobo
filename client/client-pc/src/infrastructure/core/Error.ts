/**
 * Basic application error
 */
export interface AppError {
  code: string;
  message: string;
  error: string;
}

/**
 * Create instance of AppError based on partial input
 * @param payload - partial app error or undefined
 */
export const createAppError = (payload: Partial<AppError> | undefined): AppError => ({
  code: String(-1),
  message: 'Undefined error',
  error: 'Undefined error',
  ...payload
});