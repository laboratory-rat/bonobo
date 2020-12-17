import * as AM from '@/infrastructure/app_model';
import * as DS from '@/infrastructure/dataset';
import * as F from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import * as ERR from '@/infrastructure/core/Error';
import * as NS from '@/infrastructure/services/NotifyService';
import { AppState } from '@/store';
import { ActionTree, Commit, GetterTree, Module, MutationTree } from 'vuex';
import { EnumAppDatasetProcessType } from '@/infrastructure/dataset';

export interface AppDatasetInfo {
  metadata: DS.AppDatasetMetadata;
  data: DS.AppDataset | null;
  inputsCount: number;
  outputsCount: number;
  type: EnumAppDatasetProcessType;
  disabled: boolean;
}

export interface AppPredictionStatus {
  id: string;
  isInProgress: boolean;
  metadata: AM.AppModelPredictionMetadata;
  result: AM.AppModelPredictionResult | null;
  error?: unknown;
}

export interface AppModelPredictionMetadataCreateModel {
  datasetId: string;
  datasetName: string;
  isValidation: boolean;
}

export interface StoreAppModelPredictionListState {
  [key: string]: unknown;
  modelId: string | null;
  modelMetadata: AM.AppModel | null;
  availableDatasets: AppDatasetInfo[];
  predictionResults: AppPredictionStatus[];
}

const _defaultState = (): StoreAppModelPredictionListState => ({
  modelId: null,
  modelMetadata: null,
  predictionResults: [],
  availableDatasets: []
});


export enum EnumStoreAppModelPredictionListGetters {
  isInProgress = 'IS_IN_PROGRESS',
  modelId = 'MODEL_ID',
  modelMetadata = 'MODEL_METADATA',
  datasetsStatuses = 'DATASET_STATUSES',
  predictionsResults = 'PREDICTION_RESULTS',
}

enum EnumStoreAppModelPredictionListMutations {
  update = 'UPDATE'
}

export enum EnumStoreAppModelPredictionListActions {
  setModel = 'SET_MODEL',
  refreshAvailableDatasets = 'REFRESH_AVAILABLE_DATASETS',
  createPredictionMetadata = 'CREATE_PREDICTION_RESULT',
}

const _getters = EnumStoreAppModelPredictionListGetters;
const _mutations = EnumStoreAppModelPredictionListMutations;
const _actions = EnumStoreAppModelPredictionListActions;

export const getters: GetterTree<StoreAppModelPredictionListState, AppState> = {
  [_getters.isInProgress]: state => state.predictionResults.some(x => x.isInProgress) ?? false,
  [_getters.modelId]: state => state.modelId,
  [_getters.modelMetadata]: state => state.modelMetadata,
  [_getters.datasetsStatuses]: state => state.availableDatasets,
  [_getters.predictionsResults]: state => state.predictionResults,
};

export const mutations: MutationTree<StoreAppModelPredictionListState> = {
  [_mutations.update]: (state, nState: Partial<StoreAppModelPredictionListState>) => {
    for (const key in nState) {
      state[key] = nState[key];
    }
  }
};

const _commit = <T>(commit: Commit, newState: Partial<StoreAppModelPredictionListState>) => (obj: T) => {
  commit(_mutations.update, newState);
  return obj;
};

export const actions: ActionTree<StoreAppModelPredictionListState, AppState> = {
  [_actions.setModel]: ({ commit, state }, payload: { id: string }): E.Either<ERR.AppError, unknown> =>
    F.pipe(
      payload,
      E.fromNullable(ERR.createAppError({ message: 'Model id is null' })),
      _commit(commit, {
        ..._defaultState(),
        modelId: payload?.id,
        modelMetadata: null,
        predictionResults: []
      }),
      E.chain(AM.readAppModel),
      E.map(model =>
        _commit(commit, {
          modelMetadata: model
        })(model)
      ),
      E.chain(_ => {
        return AM.scanAppModelPredictionMetadatas({ modelId: payload.id });
      }),
      E.map(metadatas => _commit(commit, {
        predictionResults: metadatas.map(metadata =>
          ({
            id: metadata.id,
            isInProgress: false,
            metadata: metadata,
            result: null,
          })
        )
      })(null),
      )
    ),

  [_actions.refreshAvailableDatasets]: ({ commit, state }) =>
    F.pipe(
      state.modelMetadata,
      E.fromNullable(ERR.createAppError({ message: 'Model is null' })),
      E.map(model =>
        F.pipe(
          DS.scanMetadatas(),
          metadatas => metadatas
            .filter(x => x.type != EnumAppDatasetProcessType.training)
            .map(metadata => ({
              metadata: metadata,
              inputsCount: metadata.colsInputsCount,
              outputsCount: metadata.colsCount - metadata.colsInputsCount,
              data: null,
              type: metadata.type,
              disabled: model.inputsCount != metadata.colsInputsCount || (metadata.type != EnumAppDatasetProcessType.prediction && model.outputsCount != (metadata.colsCount - metadata.colsInputsCount))
            }) as AppDatasetInfo),
          datasetsInfo => _commit(commit, {
            availableDatasets: datasetsInfo
          })(datasetsInfo)
        )
      ),
      E.fold(
        NS.toastError,
        () => undefined
      )
    ),
  [_actions.createPredictionMetadata]: ({ state }, payload: AppModelPredictionMetadataCreateModel): E.Either<ERR.AppError, AM.AppModelPredictionMetadata> =>
    F.pipe(
      state.modelMetadata,
      E.fromNullable(ERR.createAppError({ message: 'Model metadata is null' })),
      E.map(model => ({
        modelId: model.id,
        modelName: model.name,
        datasetId: payload.datasetId,
        datasetName: payload.datasetName,
        isValidation: payload.isValidation
      })),
      E.map(AM.createAppModelPredictionMetadata),
      E.chain(AM.writeAppModelPredictionMetadata),
    )
};

export const storeAppModelPredictionListModule: Module<StoreAppModelPredictionListState, AppState> = {
  namespaced: true,
  state: _defaultState,
  getters,
  mutations,
  actions
};