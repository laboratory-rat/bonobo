import { Module } from 'vuex';
import { AppState } from '@/store';
import { storeDatasetUploadModule as upload } from './children/upload/store';
import { storeDatasetListModule as list } from './children/list/store';

export interface StoreDatasetState {
  error: undefined;
}

const defaultState = (): StoreDatasetState => ({
  error: undefined
});

export const storeDatasetModule: Module<StoreDatasetState, AppState> = {
  namespaced: true,
  state: defaultState,
  modules: {
    upload,
    list
  }
};