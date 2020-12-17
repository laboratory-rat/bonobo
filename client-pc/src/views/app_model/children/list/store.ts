import { AppModel } from '@/infrastructure/app_model';
import { AppState } from '@/store';
import { ActionTree, Commit, GetterTree, Module, MutationTree } from 'vuex';
import * as E from 'fp-ts/Either';
import * as NS from '@/infrastructure/services/NotifyService';
import * as AP from '@/infrastructure/app_model';
import * as F from 'fp-ts/function';
import { createAppError } from '@/infrastructure/core';

export interface StoreAppModelListState {
  [key: string]: unknown;
  list: AppModel[];
}

const _defaultState = (): StoreAppModelListState => ({
  list: []
});

export enum EnumStoreAppModelListGetters {
  list = 'LIST'
}

enum EnumStoreAppModelListMutations {
  update = 'UPDATE'
}

export enum EnumStoreAppModelListActions {
  refresh = 'REFRESH',
  deleteById = 'DELETE_BY_ID'
}

const _getters = EnumStoreAppModelListGetters;
const _mutations = EnumStoreAppModelListMutations;
const _actions = EnumStoreAppModelListActions;

const getters: GetterTree<StoreAppModelListState, AppState> = {
  [_getters.list]: state => state.list
};

const mutations: MutationTree<StoreAppModelListState> = {
  [_mutations.update]: (state, payload: Partial<StoreAppModelListState>) => {
    for (const key in payload) {
      state[key] = payload[key];
    }
  }
};

const _commit = <T>(commit: Commit, newState: Partial<StoreAppModelListState>) => (obj: T) => {
  commit(_mutations.update, newState);
  return obj;
};

const actions: ActionTree<StoreAppModelListState, AppState> = {
  [_actions.refresh]: ({ commit }) => {
    _commit(commit, _defaultState())(null);
    F.pipe(
      null,
      AP.scanAppModels,
      E.fold(
        (error) => NS.toastError(error),
        (list) => _commit(commit, { list })(null)
      )
    );
  },

  [_actions.deleteById]: ({ dispatch }, payload: { id: string }) =>
    F.pipe(
      payload,
      E.fromNullable(createAppError({ message: 'Model id is null' })),
      E.chain(AP.deleteAppModelFolder),
      E.fold(
        NS.toastError,
        () => dispatch(_actions.refresh)
      )
    ),
};

export const storeAppModelListModule: Module<StoreAppModelListState, AppState> = {
  namespaced: true,
  state: _defaultState,
  getters,
  mutations,
  actions
};
