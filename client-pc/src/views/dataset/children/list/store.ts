import { AppDatasetMetadata, deleteDatasetById, scanMetadatas } from '@/infrastructure/dataset';
import { AppState } from '@/store';
import { GetterTree, MutationTree, ActionTree, Module, Commit } from 'vuex';
import * as E from 'fp-ts/Either';
import * as NS from '@/infrastructure/services/NotifyService';
import { createAppError } from '@/infrastructure/core';

export interface StoreDatasetListState {
  [key: string]: unknown;
  isLoading: boolean;
  list: AppDatasetMetadata[];
}

const _defaultState = (): StoreDatasetListState => ({
  isLoading: false,
  list: []
});

export enum EnumStoreDatasetListGetters {
  isLoading = 'IS_LOADING',
  list = 'LIST'
}

export enum EnumStoreDatasetListMutations {
  update = 'UPDATE'
}

export enum EnumStoreDatasetListActions {
  deleteById = 'DELETE_BY_ID',
  refresh = 'REFRESH'
}

const _getters = EnumStoreDatasetListGetters;
const _mutations = EnumStoreDatasetListMutations;
const _actions = EnumStoreDatasetListActions;

const getters: GetterTree<StoreDatasetListState, AppState> = {
  [_getters.isLoading]: state => state.isLoading,
  [_getters.list]: state => state.list
};

const _commitState = <TVal1>(commit: Commit, newState: Partial<StoreDatasetListState>) => (obj: TVal1) => {
  commit(_mutations.update, newState);
  return obj;
};

const mutations: MutationTree<StoreDatasetListState> = {
  [_mutations.update]: (state, payload: Partial<StoreDatasetListState>) => {
    for (const key in payload) {
      state[key] = payload[key];
    }
  }
};

const actions: ActionTree<StoreDatasetListState, AppState> = {
  [_actions.refresh]: ({ commit }) =>
    E.tryCatch(
      () => {
        const metadatas = scanMetadatas();
        _commitState(commit, {
          isLoading: false,
          list: metadatas
        })(null);
      },
      (e) => NS.toastError(createAppError({ message: String(e) }))
    ),

  [_actions.deleteById]: ({ dispatch }, payload: { id: string }) =>
    E.tryCatch(
      () => {
        deleteDatasetById(payload);
        dispatch(_actions.refresh);
      },
      (reason) => NS.toastError(createAppError({ message: String(reason) }))
    )
};

export const storeDatasetListModule: Module<StoreDatasetListState, AppState> = {
  namespaced: true,
  state: _defaultState,
  getters: getters,
  mutations: mutations,
  actions: actions
};
