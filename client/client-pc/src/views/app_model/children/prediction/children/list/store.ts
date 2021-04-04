import * as AM from '@/infrastructure/app_model';
import * as DS from '@/infrastructure/dataset';
import * as F from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import * as ERR from '@/infrastructure/core/Error';
import * as NS from '@/infrastructure/services/NotifyService';
import { AppState } from '@/store';
import { ActionTree, Commit, GetterTree, Module, MutationTree } from 'vuex';
import { EnumAppDatasetMetadataProcessType } from '@/infrastructure/dataset';
import { getAppDI } from '@/di/AppDI';

const datasetRepository = () => getAppDI().datasetRepository;

export interface AppDatasetInfo {
  metadata: DS.AppDatasetMetadata;
  data: DS.AppDataset | null;
  inputsCount: number;
  outputsCount: number;
  type: EnumAppDatasetMetadataProcessType;
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

const _commitSimple = (commit: Commit, newState: Partial<StoreAppModelPredictionListState>) => {
  commit(_mutations.update, newState);
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
      TE.fromEither,
      TE.chain(model =>
        F.pipe(
          datasetRepository().List({
            limit: 100,
          }),
          TE.map(metadataList => metadataList.filter(x => x.datasetProcessType != EnumAppDatasetMetadataProcessType.training)),
          TE.map(list => list.map(md => ({
            metadata: md,
            data: null,
            type: md.datasetProcessType,
            inputsCount: md.header.filter(x => !x.isOutput).length,
            outputsCount: md.header.filter(x => x.isOutput).length,
            disabled: model.inputsCount != md.header.filter(x => !x.isOutput).length
,          }) as AppDatasetInfo)),
        )
      ),
      TE.fold(
        (err) => {
          NS.toastError(err);
          return TE.left(err);
        },
        (_) => {
          console.log(_);
          _commitSimple(commit, {
            availableDatasets: _
          });
          return TE.right(_);
        }
      )
    )(),

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
      E.mapLeft(err => {
        NS.toastError(err);
        return err;
      })
    )
};

export const storeAppModelPredictionListModule: Module<StoreAppModelPredictionListState, AppState> = {
  namespaced: true,
  state: _defaultState,
  getters,
  mutations,
  actions
};