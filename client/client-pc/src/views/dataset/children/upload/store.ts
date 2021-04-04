import { AppState } from '@/store';
import { GetterTree, MutationTree, ActionTree, Module, Commit } from 'vuex';
import * as E from 'fp-ts/lib/Either';
import * as F from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import { AppError } from '@/infrastructure/core';
import {
  AppDatasetApprove,
  AppDatasetApproveHeader,
  AppDatasetMetadata,
  EnumAppDatasetMetadataProcessType
} from '@/infrastructure/dataset';
import * as NS from '@/infrastructure/services/NotifyService';
import { getAppDI } from '@/di/AppDI';

const datasetRepository = () => getAppDI().datasetRepository;
const processError = (err: AppError): AppError => {
  NS.toastError(err);
  return err;
};

export interface AppDatasetApproveSelected extends AppDatasetApprove {
  selected: number[];
  isLoading: boolean;
}

export interface StoreDatasetUploadModel {
  id: string;
}

export interface StoreDatasetApprovedColumn {
  index: number;
  originalIndex: number;
  isSelected: boolean;
  title: string;
}

export interface StoreDatasetUploadState {
  [key: string]: unknown;
  isLoading: boolean;
  error: unknown;
  model: StoreDatasetUploadModel;
  processed: AppDatasetMetadata[];
  approvedMetadataList: string[];
  selectedMetadataList: string[];
  selectedMetadataMap: Map<string, AppDatasetApproveSelected>;
}

const defaultState = (): StoreDatasetUploadState => ({
  isLoading: false,
  error: null,
  model: {
    id: '1aPutb-adaABiY4jlFuldib-aZRN8PAbl6vRQdZDkfgk'
  },
  processed: [],
  approvedMetadataList: [],
  selectedMetadataList: [],
  selectedMetadataMap: new Map()
});

export const EnumStoreDatasetUploadGetters = {
  isLoading: 'IS_LOADING',
  error: 'ERROR',
  model: 'model',
  processed: 'PROCESSED',
  approvedMetadataList: 'APPROVED_METADATA_LIST',
  selectedMetadataList: 'SELECTED_METADATA_LIST',
  selectedMetadataMap: 'SELECTED_METADATA_MAP'
};

export const EnumStoreDatasetUploadMutations = {
  update: 'UPDATE'
};

export const EnumStoreDatasetUploadActions = {
  updateModel: 'SET_MODEL',
  upload: 'UPLOAD',
  reset: 'RESET',
  toggleScheme: 'TOGGLE_SCHEME',
  approveScheme: 'APPROVE_SCHEME',
  updateScheme: 'UPDATE_SCHEME'
};

const _getters = EnumStoreDatasetUploadGetters;
const _mutations = EnumStoreDatasetUploadMutations;
const _actions = EnumStoreDatasetUploadActions;

export type onSaveActionResponse = E.Either<AppError[], unknown>;

const getters: GetterTree<StoreDatasetUploadState, AppState> = {
  [_getters.isLoading]: state => state.isLoading,
  [_getters.error]: state => state.error,
  [_getters.model]: state => state.model,
  [_getters.approvedMetadataList]: state => state.approvedMetadataList,
  [_getters.processed]: state => state.processed,
  [_getters.selectedMetadataList]: state => state.selectedMetadataList,
  [_getters.selectedMetadataMap]: state => state.selectedMetadataMap
};

const _commitState = <T>(
  commit: Commit,
  state: Partial<StoreDatasetUploadState>
) => (a: T): T => {
  commit(EnumStoreDatasetUploadMutations.update, {
    ...state
  });

  return a;
};

const _commitStateSimple = (
  commit: Commit,
  state: Partial<StoreDatasetUploadState>
): void => {
  commit(_mutations.update, state);
};

const mutations: MutationTree<StoreDatasetUploadState> = {
  [EnumStoreDatasetUploadMutations.update]: (
    state,
    payload: Partial<StoreDatasetUploadState>
  ) => {
    for (const key in payload) {
      state[key] = payload[key];
    }
  }
};

const actions: ActionTree<StoreDatasetUploadState, AppState> = {
  /**
   * Update model.
   * @param commit
   * @param state
   * @param payload
   */
  [EnumStoreDatasetUploadActions.updateModel]: (
    { commit, state },
    payload: StoreDatasetUploadModel
  ) => {
    commit(EnumStoreDatasetUploadMutations.update, {
      ...state,
      model: payload
    });
  },

  /**
   * Read google spreadsheet and prepare metadata models
   *
   * @param commit
   * @param state
   */
  [_actions.upload]: async ({ commit, state }) => {
    return F.pipe(
      { spreadsheetID: state.model.id },
      _commitState(commit, {
        isLoading: true,
        error: null,
        processed: [],
        selectedMetadataList: [],
        approvedMetadataList: [],
        selectedMetadataMap: new Map()
      }),
      datasetRepository().CreateFromSpreadsheet,
      TE.fold(
        err => {
          _commitStateSimple(commit, {
            isLoading: false,
            error: err
          });

          return TE.left(processError(err));
        },
        response => {
          _commitStateSimple(commit, {
            isLoading: false,
            processed: response
          });

          return TE.right(response);
        }
      )
    )();
  },

  /**
   * Select / unselect worksheet if possible.
   * @param commit
   * @param state
   * @param worksheetID
   */
  [_actions.toggleScheme]: ({ commit, state }, worksheetID: string): void => {
    if (!state.processed.some(x => x.id == worksheetID)) {
      return;
    }

    if (state.approvedMetadataList.some(x => x == worksheetID)) {
      return;
    }

    const selectedIndex = state.selectedMetadataList.indexOf(worksheetID);
    const update: Partial<StoreDatasetUploadState> = {
      selectedMetadataList: [...state.selectedMetadataList]
    };
    if (selectedIndex === -1) {
      update.selectedMetadataList!.push(worksheetID);
    } else {
      update.selectedMetadataList!.splice(selectedIndex, 1);
    }

    if (!state.selectedMetadataMap.has(worksheetID)) {
      const worksheet = state.processed.find(x => x.id == worksheetID)!;
      update.selectedMetadataMap = new Map(state.selectedMetadataMap);
      update.selectedMetadataMap.set(worksheetID, {
        selected: [],
        isLoading: false,
        datasetProcessType: EnumAppDatasetMetadataProcessType.training,
        name: worksheet.name,
        header: worksheet.header.map(h => ({
          originIndex: h.index,
          index: h.index,
          isSelected: false,
          title: h.title,
          colType: h.type,
          decimals: 0,
          isOutput: h.isOutput
        }))
      });
    }

    _commitStateSimple(commit, update);
  },

  /**
   * Update properties of column
   * @param commit
   * @param state
   * @param payload
   */
  [_actions.updateScheme]: (
    { commit, state },
    payload: { worksheetID: string; model: AppDatasetApprove }
  ) => {
    if (
      !state.selectedMetadataList.some(x => x == payload.worksheetID) ||
      !state.selectedMetadataMap.has(payload.worksheetID) ||
      state.approvedMetadataList.some(x => x == payload.worksheetID)
    ) {
      return;
    }

    console.log(payload.model);
    const update = {
      selectedMetadataMap: [...state.selectedMetadataMap]
        .map(([wID, data]) => {
          if (wID != payload.worksheetID) {
            return { ID: wID, DATA: data };
          }

          return {
            ID: wID,
            DATA: {
              ...payload.model
            }
          };
        })
        .reduce((map, pair) => (map.set(pair.ID, pair.DATA), map), new Map())
    };

    _commitStateSimple(commit, update);
  },

  /**
   * Send prepared metadata to BE side.
   * @param commit
   * @param state
   * @param metadataID
   */
  [_actions.approveScheme]: ({ commit, state }, metadataID: string) => {
    const updateSelectedMetadataMapIsLoading = (isLoading: boolean) =>
      [...state.selectedMetadataMap]
        .map(([wID, data]) => {
          return {
            id: wID,
            data:
              wID == metadataID
                ? {
                    ...data,
                    isLoading: isLoading
                  }
                : data
          };
        })
        .reduce((map, pair) => map.set(pair.id, pair.data), new Map());
    return F.pipe(
      null,
      () => {
        _commitStateSimple(commit, {
          isLoading: true,
          error: null,
          selectedMetadataMap: updateSelectedMetadataMapIsLoading(true)
        });
        const m = state.selectedMetadataMap.get(metadataID)!;
        return {
          metadataID: metadataID,
          model: {
            ...m,
            header: [...m.header].filter(
              x => m.selected.indexOf(x.originIndex) !== -1
            )
          } as AppDatasetApprove
        };
      },
      datasetRepository().ApproveFromSpreadsheet,
      TE.fold(
        err => {
          processError(err);
          _commitStateSimple(commit, {
            isLoading: false,
            error: err,
            selectedMetadataMap: updateSelectedMetadataMapIsLoading(false)
          });
          return TE.left(err);
        },
        r => {
          _commitStateSimple(commit, {
            isLoading: false,
            selectedMetadataMap: updateSelectedMetadataMapIsLoading(false),
            approvedMetadataList: [...state.approvedMetadataList, metadataID]
          });
          return TE.right(r);
        }
      )
    )();
  },

  [EnumStoreDatasetUploadActions.reset]: ({ commit }) => {
    commit(EnumStoreDatasetUploadMutations.update, defaultState());
  }
};

export const storeDatasetUploadModule: Module<
  StoreDatasetUploadState,
  AppState
> = {
  namespaced: true,
  state: defaultState,
  getters: getters,
  mutations: mutations,
  actions: actions
};
