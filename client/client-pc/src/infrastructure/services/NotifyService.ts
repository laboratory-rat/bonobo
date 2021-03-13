import { Notify } from 'quasar';
import { AppError } from '../core';

Notify.setDefaults({
  position: 'bottom-right',
  timeout: 2500,
  textColor: 'white',
  actions: [
    {
      icon: 'close',
      color: 'white'
    }
  ]
});

export const toastError = (error: AppError) => {
  Notify.create({
    message: error.message,
    color: 'red',
    icon: 'error',
  });
};