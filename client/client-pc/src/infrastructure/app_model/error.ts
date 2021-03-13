import { AppError } from '../core/Error';

export interface AppModelError extends AppError {
  code: '1100' | '1101' | '1102';
}

export const createAppModelValiadtionError = (reason: string): AppModelError => ({
  code: '1100',
  message: reason,
  error: 'App model validation error: ' + reason
});