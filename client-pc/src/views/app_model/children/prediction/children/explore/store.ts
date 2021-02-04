import * as AM from '@/infrastructure/app_model';
import * as F from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import * as ERR from '@/infrastructure/core/Error';
import * as NS from '@/infrastructure/services/NotifyService';
import { AppState } from '@/store';
import { ActionTree, Commit, GetterTree, Module, MutationTree } from 'vuex';
import { getAppDI } from '@/di/AppDI';

const datasetRepository = () => getAppDI().datasetRepository;

export interface StoreAppModelPredictionExploreState {
  [key: string]: unknown;
  isInProgress: boolean;
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
  isInProgress: false,
  metadata: null,
  metadataId: null,
  modelMetadata: null,
  tfModel: null,
  modelId: null,
  result: null
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

export const getters: GetterTree<
  StoreAppModelPredictionExploreState,
  AppState
> = {
  [_getters.model]: state => state.modelMetadata,
  [_getters.isInProgress]: state => state.inInProgress,
  [_getters.metadata]: state => state.metadata,
  [_getters.result]: state => state.result,
  [_getters.tfModel]: state => state.tfModel
};

export const mutations: MutationTree<StoreAppModelPredictionExploreState> = {
  [_mutations.update]: (
    state,
    nState: Partial<StoreAppModelPredictionExploreState>
  ) => {
    for (const key in nState) {
      state[key] = nState[key];
    }
  }
};

const _commit = <T>(
  commit: Commit,
  newState: Partial<StoreAppModelPredictionExploreState>
) => (obj: T) => {
  commit(_mutations.update, newState);
  return obj;
};

/**
 * Update state and return void.
 * TODO: Remove all old commit functions. Do I need them now?
 * @param commit
 * @param newState
 */
const _commitSimple = (
  commit: Commit,
  newState: Partial<StoreAppModelPredictionExploreState>
) => {
  commit(_mutations.update, newState);
};

export const actions: ActionTree<
  StoreAppModelPredictionExploreState,
  AppState
> = {
  [_actions.init]: (
    { commit },
    payload: { modelId: string; predictionId: string }
  ): void =>
    F.pipe(
      payload,
      E.fromNullable(ERR.createAppError({ message: 'Model not selected' })),
      E.chain(payload => {
        if (!payload.modelId || !payload.modelId.trim().length)
          return E.left(ERR.createAppError({ message: 'Model ID is null' }));
        if (!payload.predictionId || !payload.predictionId.trim().length)
          return E.left(
            ERR.createAppError({ message: 'Prediction ID is null' })
          );
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
      E.fold(NS.toastError, result => {
        _commit(commit, {
          error: null,
          modelId: result.modelId,
          modelMetadata: result.model,
          metadata: result.predictionMetadata,
          metadataId: result.predictionMetadata.id,
          result: result.predictionResult,
          tfModel: null
        })(null);
      })
    ),

  [_actions.process]: ({ commit, state }) => {
    return F.pipe(
      state.metadata,
      E.fromNullable(
        ERR.createAppError({ message: 'Result metadata is null' })
      ),
      TE.fromEither,
      TE.chain(metadata =>
        F.pipe(
          datasetRepository().Read({
            ID: metadata.datasetId,
            limit: 100000,
            skip: 0
          }),
          TE.map(dataset => ({
            dataset,
            metadata: metadata
          }))
        )
      ),
      TE.chain(map =>
        F.pipe(
          { id: map.metadata.modelId },
          AM.readAppModel,
          E.map(appModel => ({
            ...map,
            model: appModel
          })),
          TE.fromEither
        )
      ),
      TE.chain(payload =>
        F.pipe(
          AM.readTFModel(payload.model)(),
          TE.map(tf => ({
            ...payload,
            tf
          }))
        )
      ),
      TE.chain(payload =>
        F.pipe(
          payload.tf,
          AM.validateAppTFModel({
            model: payload.model,
            dataset: payload.dataset,
            logCallback: undefined
          }),
          TE.map(r => ({
            model: payload.model,
            result: {
              ...r,
              inputLabels: payload.dataset.header
                .filter(x => !x.isOutput)
                .map(x => x.title),
              outputLabels: payload.dataset.header
                .filter(x => x.isOutput)
                .map(x => x.title),
              datasetName: payload.dataset.name,
              datasetId: payload.dataset.id
            }
          }))
        )
      ),
      TE.chain(result =>
        F.pipe(
          AM.writeAppModelPredictionResult({
            predictionResult: result.result,
            isValidation: true,
            modelId: result.model.id
          }),
          TE.fromEither,
          TE.map(_ => result.result)
        )
      ),
      TE.fold(
        err => {
          NS.toastError(err);
          _commitSimple(commit, {
            isInProgress: false,
            error: err
          });
          return T.never;
        },
        res => {
          _commitSimple(commit, {
            result: res,
            isInProgress: false
          });
          return T.never;
        }
      )
    )();
  }
};

export const storeAppModelPredictionExploreModule: Module<
  StoreAppModelPredictionExploreState,
  AppState
> = {
  namespaced: true,
  state: _defaultState,
  getters,
  mutations,
  actions
};
