import { AppError } from '@/infrastructure/core';
import { Module } from 'vuex';
import { AppState } from '@/store';
import { storeAppModelPredictionListModule as list } from './children/list/store';
import { storeAppModelPredictionExploreModule as explore } from './children/explore/store';

export interface StoreAppModelPredictionState {
  error?: AppError;
}

const _defaultState = (): StoreAppModelPredictionState => ({});

export const storeAppModelPredictionModule: Module<StoreAppModelPredictionState, AppState> = {
  namespaced: true,
  state: _defaultState,
  modules: {
    list,
    explore
  }
};
