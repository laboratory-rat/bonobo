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
import { getAppDI } from '@/di/AppDI';
import {
  appDatasetToTensors,
  appModelToTensorOptions
} from '@/infrastructure/dataset';

const datasetRepository = () => getAppDI().datasetRepository;
const tensorNormalizationRepository = () =>
  getAppDI().tensorNormalizationRepository;

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
  trainHistory: null
});

export enum EnumStoreAppModelTrainingGetters {
  isInProgress = 'IS_IN_PROGRESS',
  appModelId = 'APP_MODEL_ID',
  appModel = 'APP_MODEL',
  appTFModel = 'APP_TF_MODEL',
  isTrainFinished = 'IS_TRAIN_FINISHED',
  trainHistory = 'TRAIN_HISTORY'
}

export enum EnumStoreAppModelTrainingMutations {
  update = 'UPDATE'
}

export enum EnumStoreAppModelTrainingActions {
  setModel = 'SET_MODEL',
  createTFModel = 'CREATE_TF_MODEL'
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

const _commit = <T>(
  commit: Commit,
  newState: Partial<StoreAppModelTrainingState>
) => (obj: T) => {
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
        error => {
          _commit(commit, {
            error: error
          })(null);
          NS.toastError(error);
        },
        model =>
          F.pipe(
            model,
            _commit(commit, {
              appModel: model
            }),
            x => {
              console.log(x);
              return x;
            },
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
        const existsHistory = (getters[
          _getters.trainHistory
        ] as AppModelHistory)
          ? {
              ...(getters[_getters.trainHistory] as AppModelHistory),
              losses: {
                ...(getters[_getters.trainHistory] as AppModelHistory).losses
              }
            }
          : {
              epoch: [],
              startedTime: moment().unix(),
              losses: {}
            };

        existsHistory.epoch = [...(existsHistory.epoch ?? []), epoch];
        for (const key in log) {
          existsHistory.losses[key] = existsHistory.losses[key]
            ? [...existsHistory.losses[key], log[key]]
            : [log[key]];
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
              finishedTime: moment().unix()
            } as AM.AppModelHistory,
            AM.writeAppModelHistory(getters[_getters.appModel]),
            E.mapLeft(NS.toastError)
          );

          const mh = getters[_getters.trainHistory] as AM.AppModelHistory;
          if (mh && Object.keys(mh.losses).length) {
            F.pipe(
              {
                ...(getters[_getters.appModel] as AM.AppModel),
                trained: true,
                updatedTime: moment().unix(),
                finalResult: {
                  ...mh.losses
                }
              },
              AM.writeAppModel,
              E.mapLeft(NS.toastError)
            );
          }
        }

        _commit(commit, {
          isTrainFinished: true
        })(null);
      }
    };

    if (state.trainHistory) {
      _commit(commit, {
        trainHistory: null,
        isTrainFinished: false
      })(null);
    }

    return F.pipe(
      state?.appModel?.datasetId,
      _commit(commit, {
        isInProgress: true
      }),
      E.fromNullable(createAppError({ message: 'No dataset id found' })),
      TE.fromEither,
      TE.chain(
        F.flow(
          id => ({
            ID: id,
            limit: 100000,
            skip: 0
          }),
          datasetRepository().Read
        )
      ),
      TE.map(dataset => ({
        dataset: dataset,
        model: state.appModel!
      })),
      TE.chain(payload =>
        F.pipe(
          payload.model!,
          AM.createAppTFModelFromModel,
          TE.fromEither,
          TE.map(x => ({
            ...payload,
            tf: x
          }))
        )
      ),
      TE.chain(payload =>
        F.pipe(
          payload.dataset,
          appDatasetToTensors(appModelToTensorOptions(payload.model, true)),
          TE.fromEither,
          TE.chain(tensors =>
            F.pipe(
              tensorNormalizationRepository().write(payload.model.id, tensors),
              TE.map(_ => ({
                ...payload,
                tensors: tensors
              }))
            )
          )
        )
      ),
      TE.chain(payload =>
        F.pipe(
          payload.tf,
          AM.trainAppTFModel({ ...payload, logCallback: trainCallback }),
          TE.map(hist => ({
            ...payload,
            hist: hist
          }))
        )
      ),
      TE.chain(payload =>
        F.pipe(
          payload.tf,
          AM.writeTFModel(payload.model),
          TE.map(_ => payload)
        )
      ),
      TE.chain(result =>
        F.pipe(
          {
            ...result,
            model: {
              ...result.model,
              trained: true,
              updatedTime: moment().unix()
            }
          },
          E.of,
          E.chain(d =>
            F.pipe(
              d.model,
              writeAppModel,
              E.map(_ => d)
            )
          ),
          TE.fromEither
        )
      ),
      TE.fold(
        err => {
          NS.toastError(err);
          _commit(commit, {
            isInProgress: false
          })(null);
          return TE.left(err);
        },
        response => {
          _commit(commit, {
            error: undefined,
            isTrainFinished: true,
            isInProgress: false,
            appTFModel: response.tf,
            appModel: response.model
          })(null);
          return TE.right(response);
        }
      )
    )();
  }
};

export const storeAppModelTrainingModule: Module<
  StoreAppModelTrainingState,
  AppState
> = {
  namespaced: true,
  state: _defaultState,
  getters,
  mutations,
  actions
};
