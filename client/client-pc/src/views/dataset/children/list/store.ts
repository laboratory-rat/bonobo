import { AppDatasetMetadata } from '@/infrastructure/dataset';
import { AppState } from '@/store';
import { GetterTree, MutationTree, ActionTree, Module, Commit } from 'vuex';
import * as E from 'fp-ts/Either';
import * as NS from '@/infrastructure/services/NotifyService';
import * as TE from 'fp-ts/TaskEither';
import * as T from 'fp-ts/Task';
import * as F from 'fp-ts/function';
import { AppError, createAppError } from '@/infrastructure/core';
import { getAppDI } from '@/di/AppDI';

const datasetRepository = () => getAppDI().datasetRepository;

const _emitError = (err: AppError): AppError => {
  NS.toastError(err);
  return err;
};

export interface StoreDatasetListState {
  [key: string]: unknown;
  error?: AppError;
  isLoading: boolean;
  limit: number;
  startAfter?: string;
  list: AppDatasetMetadata[];
}

const _defaultState = (): StoreDatasetListState => ({
  isLoading: false,
  limit: 20,
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

const _commitState = <TVal1>(
  commit: Commit,
  newState: Partial<StoreDatasetListState>
) => (obj: TVal1) => {
  commit(_mutations.update, newState);
  return obj;
};

const _commitStateSimple = (
  commit: Commit,
  newState: Partial<StoreDatasetListState>
) => commit(_mutations.update, newState);

const mutations: MutationTree<StoreDatasetListState> = {
  [_mutations.update]: (state, payload: Partial<StoreDatasetListState>) => {
    for (const key in payload) {
      state[key] = payload[key];
    }
  }
};

const actions: ActionTree<StoreDatasetListState, AppState> = {
  /**
   * Refresh metadata list.
   * @param commit
   */
  [_actions.refresh]: ({
    commit,
    state
  }): unknown => {
    _commitState(commit, {
      isLoading: true
    })(null);

    _commitStateSimple(commit, {
      isLoading: true,
      error: undefined
    });

    return F.pipe(
      {
        limit: state.limit,
        startAfter: state?.startAfter
      },
      datasetRepository().List,
      TE.fold(
        err => {
          NS.toastError(err);
          _commitStateSimple(commit, {
            isLoading: false,
            error: err
          });
          return TE.left(err);
        },
        r => {
          _commitStateSimple(commit, {
            isLoading: false,
            list: r
          });
          return TE.right(r);
        }
      )
    )();
  },

  /**
   * Delete metadata and dataset by ID.
   * @param commit
   * @param state
   * @param payload
   */
  [_actions.deleteById]: ({ commit, state }, payload: { id: string }) => {
    _commitStateSimple(commit, {
      isLoading: true,
      error: undefined
    });

    return F.pipe(
      datasetRepository().Archive({
        ID: payload.id
      }),
      TE.fold(
        err => {
          _commitStateSimple(commit, {
            isLoading: false,
            error: err
          });
          NS.toastError(err);
          return TE.left(err);
        },
        r => {
          _commitStateSimple(commit, {
            isLoading: false,
            list: [...state.list].filter(x => x.id != payload.id)
          });
          return TE.right(r);
        }
      )
    )();
  }
};

export const storeDatasetListModule: Module<StoreDatasetListState, AppState> = {
  namespaced: true,
  state: _defaultState,
  getters: getters,
  mutations: mutations,
  actions: actions
};
