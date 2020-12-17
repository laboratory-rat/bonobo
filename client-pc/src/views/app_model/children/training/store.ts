import * as AM from '@/infrastructure/app_model';
import * as DATASET from '@/infrastructure/dataset';
import * as E from 'fp-ts/Either';
import * as F from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as T from 'fp-ts/Task';
import * as NS from '@/infrastructure/services/NotifyService';
import { AppState } from '@/store';
import { Commit } from 'vuex';
import { ActionTree, GetterTree, Module, MutationTree } from 'vuex';
import { AppError, createAppError } from '@/infrastructure/core';
import { AppModelHistory, writeAppModel } from '@/infrastructure/app_model';
import moment from 'moment';

export interface StoreAppModelTrainingState {
  [key: string]: unknown;
  appModelId: string;
  appModel: AM.AppModel | null;
  isInProgress: boolean;
  appTFModel: AM.AppTFModel | null;
  error: AppError | null;
  isTrainFinished: boolean;
  trainHistory: AppModelHistory | null;
}

const _defaultState = (): StoreAppModelTrainingState => ({
  appModelId: '',
  appModel: null,
  isInProgress: false,
  isTrainFinished: false,
  appTFModel: null,
  error: null,
  trainHistory: null,
});

export enum EnumStoreAppModelTrainingGetters {
  isInProgress = 'IS_IN_PROGRESS',
  appModelId = 'APP_MODEL_ID',
  appModel = 'APP_MODEL',
  appTFModel = 'APP_TF_MODEL',
  isTrainFinished = 'IS_TRAIN_FINISHED',
  trainHistory = 'TRAIN_HISTORY',
}

export enum EnumStoreAppModelTrainingMutations {
  update = 'UPDATE'
}

export enum EnumStoreAppModelTrainingActions {
  setModel = 'SET_MODEL',
  createTFModel = 'CREATE_TF_MODEL',
}

const _getters = EnumStoreAppModelTrainingGetters;
const _mutations = EnumStoreAppModelTrainingMutations;
const _actions = EnumStoreAppModelTrainingActions;

export const getters: GetterTree<StoreAppModelTrainingState, AppState> = {
  [_getters.appModelId]: state => state.appModelId,
  [_getters.appModel]: state => state.appModel,
  [_getters.appTFModel]: state => state.appTFModel,
  [_getters.isInProgress]: state => state.isInProgress,
  [_getters.isTrainFinished]: state => state.isTrainFinished,
  [_getters.trainHistory]: state => state.trainHistory
};

export const mutations: MutationTree<StoreAppModelTrainingState> = {
  [_mutations.update]: (state, nState: Partial<StoreAppModelTrainingState>) => {
    for (const key in nState) {
      state[key] = nState[key];
    }
  }
};

const _commit = <T>(commit: Commit, newState: Partial<StoreAppModelTrainingState>) => (obj: T) => {
  commit(_mutations.update, newState);
  return obj;
};

export const actions: ActionTree<StoreAppModelTrainingState, AppState> = {
  [_actions.setModel]: ({ commit }, payload: { id: string }) =>
    F.pipe(
      payload,
      _commit(commit, { ..._defaultState(), appModelId: payload?.id }),
      E.fromNullable(createAppError({ message: 'Model id is null' })),
      E.chain(AM.readAppModel),
      E.fold(
        (error) => {
          _commit(commit, {
            error: error
          })(null);
          NS.toastError(error);
        },
        (model) =>
          F.pipe(
            model,
            _commit(commit, {
              appModel: model,
            }),
            AM.readAppModelHistory,
            E.map(x => {
              _commit(commit, {
                trainHistory: x
              })(null);
            })
          )
      )
    ),

  [_actions.createTFModel]: async ({ commit, state, getters }) => {
    const trainCallback: AM.AppTFTrainProcessLogCallback = {
      onEpochEnd: (epoch, log) => {
        let existsHistory;
        if (getters[_getters.trainHistory]) {
          existsHistory = {
            ...getters[_getters.trainHistory]
          };
        } else {
          existsHistory = {
            startedTime: moment().unix(),
            epoch: [],
            loss: [],
            valLoss: []
          } as AppModelHistory;
        }

        existsHistory.epoch = [...existsHistory.epoch ?? [], epoch];
        existsHistory.loss = [...existsHistory.loss ?? [], log['loss']];
        if (existsHistory.valLoss) {
          existsHistory.valLoss = [
            ...existsHistory.valLoss,
            log['val_loss']
          ];
        } else {
          existsHistory.valLoss = [log['val_loss']];
        }

        _commit(commit, {
          trainHistory: existsHistory
        })(null);
      },
      onTrainEnd: () => {
        if (getters[_getters.appModelId]) {
          F.pipe(
            {
              ...getters[_getters.trainHistory],
              finishedTime: moment().unix(),
            } as AM.AppModelHistory,
            AM.writeAppModelHistory(getters[_getters.appModel]),
            E.mapLeft(NS.toastError)
          );
        }

        _commit(commit, {
          isTrainFinished: true
        })(null);
      }
    };

    await F.pipe(
      state?.appModel?.datasetId,
      _commit(commit, {
        isInProgress: true
      }),
      E.fromNullable(createAppError({ message: 'No dataset id found' })),
      E.chain(DATASET.readMetadataById),
      E.chain(DATASET.readDataset),
      E.chain(dataset => F.pipe(
        state.appModel,
        E.fromNullable(createAppError({ message: 'IMPOSSIBLE' })),
        E.map(model => ({
          dataset,
          model
        }))
      )),
      E.chain(trainingPayload =>
        F.pipe(
          trainingPayload.model,
          AM.createAppTFModelFromModel,
          E.map(tf => ({
            ...trainingPayload,
            tf: tf
          }))
        )
      ),
      TE.fromEither,
      TE.chain(x => // train model
        F.pipe(
          x.tf,
          AM.trainAppTFModel({ ...x, logCallback: trainCallback }),
          TE.map(
            hist => ({
              ...x,
              hist: hist
            })
          )
        ),
      ),
      TE.chain(data =>
        F.pipe(
          data.tf,
          AM.writeTFModel(data.model),
          TE.map(_ => data)
        )
      ),
      _commit(commit, {
        isInProgress: false,
      }),
      TE.fold(
        (err) => {
          NS.toastError(err);
          return T.never;
        },
        (res) =>
          F.pipe(
            res,
            data => ({
              ...data,
              model: {
                ...data.model,
                trained: true,
                updatedTime: moment().unix(),
              }
            }),
            E.of,
            E.chain(d =>
              F.pipe(
                d,
                d => d.model,
                writeAppModel,
                E.map(_ => d)
              )
            ),
            E.map(d => _commit(commit, {
              error: undefined,
              isTrainFinished: true,
              appTFModel: d.tf,
              appModel: d.model
            })(d)),
            _ => T.never
          )
      )
    )();
  }
};

export const storeAppModelTrainingModule: Module<StoreAppModelTrainingState, AppState> = {
  namespaced: true,
  state: _defaultState,
  getters,
  mutations,
  actions
};