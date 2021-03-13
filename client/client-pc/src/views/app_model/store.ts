import { AppError } from '@/infrastructure/core';
import { AppState } from '@/store';
import { Module } from 'vuex';
import { storeAppModelListModule as list} from './children/list/store';
import {storeAppModelTrainingModule as training } from './children/training/store';
import { storeAppModelPredictionModule as prediction } from './children/prediction/store';

export interface StoreAppModelState {
  error: AppError | null;
}

const _defaultState = (): StoreAppModelState => ({
  error: null,
});

export const storeAppModelModule: Module<StoreAppModelState, AppState> = {
  namespaced: true,
  state: _defaultState,
  modules: {
    list,
    training,
    prediction
  }
};
