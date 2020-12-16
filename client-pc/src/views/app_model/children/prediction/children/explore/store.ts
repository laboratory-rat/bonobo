import * as AM from '@/infrastructure/app_model';
import * as DS from '@/infrastructure/dataset';
import * as F from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import * as ERR from '@/infrastructure/core/Error';
import * as NS from '@/infrastructure/services/NotifyService';
import { AppState } from '@/store';
import { ActionTree, Commit, GetterTree, Module, MutationTree } from 'vuex';
import { model } from '@tensorflow/tfjs';

export interface StoreAppModelPredictionExploreState {
  [key: string]: unknown;
  inInProgress: boolean;
  error: ERR.AppError | null;
  modelId: string | null;
  modelMetadata: AM.AppModel | null;
  tfModel: AM.AppTFModel | null;
  metadataId: string | null;
  metadata: AM.AppModelPredictionMetadata | null;
  result: AM.AppModelPredictionResult | null;
}

const _defaultState = (): StoreAppModelPredictionExploreState => ({
  error: null,
  inInProgress: false,
  metadata: null,
  metadataId: null,
  modelMetadata: null,
  tfModel: null,
  modelId: null,
  result: null,
});


export enum EnumStoreGetters {
  isInProgress = 'IS_IN_PROGRESS',
  model = 'MODEL',
  metadata = 'METADATA',
  tfModel = 'TF_MODEL',
  result = 'RESULT'
}

enum EnumStoreMutations {
  update = 'UPDATE'
}

export enum EnumStoreActions {
  init = 'INIT',
  process = 'PROCESS'
}

const _getters = EnumStoreGetters;
const _mutations = EnumStoreMutations;
const _actions = EnumStoreActions;

export const getters: GetterTree<StoreAppModelPredictionExploreState, AppState> = {
  [_getters.model]: state => state.modelMetadata,
  [_getters.isInProgress]: state => state.inInProgress,
  [_getters.metadata]: state => state.metadata,
  [_getters.result]: state => state.result,
  [_getters.tfModel]: state => state.tfModel
};

export const mutations: MutationTree<StoreAppModelPredictionExploreState> = {
  [_mutations.update]: (state, nState: Partial<StoreAppModelPredictionExploreState>) => {
    for (const key in nState) {
      state[key] = nState[key];
    }
  }
};

const _commit = <T>(commit: Commit, newState: Partial<StoreAppModelPredictionExploreState>) => (obj: T) => {
  commit(_mutations.update, newState);
  return obj;
};

export const actions: ActionTree<StoreAppModelPredictionExploreState, AppState> = {
  [_actions.init]: ({ commit }, payload: { modelId: string; predictionId: string }): void =>
    F.pipe(
      payload,
      E.fromNullable(ERR.createAppError({ message: 'Model not selected' })),
      E.chain(payload => {
        if (!payload.modelId || !payload.modelId.trim().length) return E.left(ERR.createAppError({ message: 'Model ID is null' }));
        if (!payload.predictionId || !payload.predictionId.trim().length) return E.left(ERR.createAppError({ message: 'Prediction ID is null' }));
        return E.right(payload);
      }),

      E.chain(payload =>
        F.pipe(
          { id: payload.modelId },
          AM.readAppModel,
          E.map(model => ({
            ...payload,
            model: model
          }))
        )
      ),
      E.chain(payload =>
        F.pipe(
          { id: payload.predictionId, modelId: payload.modelId },
          AM.readAppModelPredictionMetadata,
          E.map(predictionMetadata => ({
            ...payload,
            predictionMetadata: predictionMetadata
          }))
        )
      ),
      E.chain(payload =>
        F.pipe(
          { id: payload.predictionId, modelId: payload.modelId },
          E.fromNullable(ERR.createAppError({ message: '' })),
          E.chain(c => {
            const readResult = AM.readAppModelPredictionResult(c);
            if (E.isLeft(readResult)) return E.right(null);
            return readResult;
          }),
          E.map(res => ({
            ...payload,
            predictionResult: res
          }))
        )
      ),
      E.fold(
        NS.toastError,
        (result) => {
          _commit(commit, {
            error: null,
            modelId: result.modelId,
            modelMetadata: result.model,
            metadata: result.predictionMetadata,
            metadataId: result.predictionId,
            result: result.predictionResult,
            tfModel: null
          })(null);
        },
      )
    ),

  [_actions.process]: async ({ commit, state }) =>
    await F.pipe(
      state.metadata,
      E.fromNullable(ERR.createAppError({ message: 'Result metadata is null' })),
      E.chain(metadata =>
        F.pipe(
          { id: metadata.datasetId },
          DS.readDataset,
          E.map(dataset => ({
            dataset,
            metadata
          }))
        )
      ),
      E.chain(map =>
        F.pipe(
          { id: map.metadata.modelId },
          AM.readAppModel,
          E.map(appModel => ({
            ...map,
            model: appModel
          }))
        )
      ),
      TE.fromEither,
      TE.chain(payload =>
        F.pipe(
          AM.readTFModel(payload.model)(),
          TE.map(tf => ({
            ...payload,
            tf
          }))
        )
      ),
      TE.chain(data =>
        F.pipe(
          data.tf,
          AM.validateAppTFModel(data),
        )
      ),
      TE.fold(
        err => {
          NS.toastError(err);
          return T.never;
        },
        (res) => {
          console.log(res);
          return T.never;
        }
      )
    )()
};

export const storeAppModelPredictionExploreModule: Module<StoreAppModelPredictionExploreState, AppState> = {
  namespaced: true,
  state: _defaultState,
  getters,
  mutations,
  actions
};