import { AppState } from '@/store';
import { GetterTree, MutationTree, ActionTree, Module, Commit } from 'vuex';
import { readGoogleSheetDocument } from '@/infrastructure/source/google/GoogleSheetsReader';
import { createFromGoogleSheet, googleSheetToSource, SourceGoogleScheetColScheme, SourceGoogleSheet, SourceGoogleSheetScheme, SourceGoogleSheetWorksheetScheme, SourceGoogleWorksheetCol } from '@/infrastructure/source/google';
import * as E from 'fp-ts/lib/Either';
import * as F from 'fp-ts/lib/function';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import { appConfig } from '@/infrastructure/AppConfig';
import { AppError, createAppError } from '@/infrastructure/core';
import { EnumAppDatasetColType, EnumAppDatasetProcessType, writeDataset } from '@/infrastructure/dataset';
import * as IM from '@/infrastructure/core/IndexedMap';
import * as NS from '@/infrastructure/services/NotifyService';
import { sourceGoogleSheetWorksheetSchemeValidator } from '@/infrastructure/source/google/validators';

export interface StoreDatasetUploadModel {
  id: string;
}

export interface StoreDatasetUploadState {
  [key: string]: unknown;
  isLoading: boolean;
  error: unknown;
  model: StoreDatasetUploadModel;
  uploaded: SourceGoogleSheet | null;
  scheme: SourceGoogleSheetScheme;
  selectedWorksheetsIndexes: number[];
}

const defaultState = (): StoreDatasetUploadState => ({
  isLoading: false,
  error: null,
  model: {
    id: '1aPutb-adaABiY4jlFuldib-aZRN8PAbl6vRQdZDkfgk'
  },
  uploaded: null,
  selectedWorksheetsIndexes: [],
  scheme: {
    sheets: {}
  }
});

export const EnumStoreDatasetUploadGetters = {
  isLoading: 'IS_LOADING',
  error: 'ERROR',
  model: 'model',
  uploaded: 'UPLOADED',
  uploadedTableDataWorksheets: 'UPLOADED_TABLE_DATA_WORKSHEETS',
  selectedWorksheetsIndexes: 'SELECTED_WORKSHEETS_INDEXES',
  scheme: 'SCHEME'
};

export const EnumStoreDatasetUploadMutations = {
  update: 'UPDATE'
};

export const EnumStoreDatasetUploadActions = {
  updateModel: 'SET_MODEL',
  upload: 'UPLOAD',
  reset: 'RESET',
  updateSelectedWorksheets: 'UPDATE_SELECTED_WORKSHEETS',
  updateColumn: 'UPDATE_COLUMN',
  updateWorksheetMetadata: 'UPDATE_SCHEME_METADATA',
  save: 'SAVE'
};

export type onSaveActionResponse = E.Either<AppError[], unknown>;

const getters: GetterTree<StoreDatasetUploadState, AppState> = {
  [EnumStoreDatasetUploadGetters.isLoading]: (state) => state.isLoading,
  [EnumStoreDatasetUploadGetters.error]: (state) => state.error,
  [EnumStoreDatasetUploadGetters.model]: (state) => state.model,
  [EnumStoreDatasetUploadGetters.uploaded]: (state) => state.uploaded,
  [EnumStoreDatasetUploadGetters.selectedWorksheetsIndexes]: state => state.selectedWorksheetsIndexes,
  [EnumStoreDatasetUploadGetters.scheme]: state => state.scheme,
};

const mutations: MutationTree<StoreDatasetUploadState> = {
  [EnumStoreDatasetUploadMutations.update]: (state, payload: StoreDatasetUploadState) => {
    for (const key in state) {
      state[key] = payload[key];
    }
  }
};

const _commitState = <T>(commit: Commit, state: StoreDatasetUploadState, nState: Partial<StoreDatasetUploadState>) => (a: T): T => {
  commit(EnumStoreDatasetUploadMutations.update, {
    ...state,
    ...nState
  });
  return a;
};

const actions: ActionTree<StoreDatasetUploadState, AppState> = {
  [EnumStoreDatasetUploadActions.updateModel]: ({ commit, state }, payload: StoreDatasetUploadModel) => {
    commit(EnumStoreDatasetUploadMutations.update, {
      ...state,
      model: payload
    });
  },

  [EnumStoreDatasetUploadActions.upload]: ({ commit, state }) => {
    F.pipe(
      state.model.id,
      _commitState(
        commit,
        state,
        {
          isLoading: true,
          error: null,
          uploaded: null,
          scheme: {
            sheets: {}
          },
          selectedWorksheetsIndexes: []
        }
      ),
      readGoogleSheetDocument(appConfig),
      TE.chain(createFromGoogleSheet),
      TE.fold(
        (error) => {
          NS.toastError(error);
          _commitState(commit, state, {
            isLoading: false,
            uploaded: null,
            error: error
          })(null);
          return T.never;
        },
        (source) => {
          _commitState(commit, state, {
            isLoading: false,
            uploaded: source,
            scheme: {
              sheets: {},
            }
          })(null);
          return T.never;
        }
      ),
    )();
  },

  [EnumStoreDatasetUploadActions.updateSelectedWorksheets]: ({ commit, state }, payload: { selectedWorksheetsIndexes: number[] }) => {
    const { uploaded } = state;
    if (!uploaded) return;
    const changed = [
      ...IM.getKeys(state.scheme.sheets).filter(exists => !payload.selectedWorksheetsIndexes.some(n => n == exists)),
      ...payload.selectedWorksheetsIndexes.filter(fromPayload => !IM.getKeys(state.scheme.sheets).some(exists => exists == fromPayload))
    ];

    changed.forEach((changedIndex) => {
      F.pipe(
        changedIndex,
        E.fromNullable(createAppError({ message: 'Sheet index is null' })),
        _commitState(commit, state, {
          error: null
        }),
        E.chain(() =>
          E.tryCatch(
            () => {
              const updatedSheetsSchemes = IM.clone(state.scheme.sheets);
              const existsSheet = updatedSheetsSchemes[changedIndex];
              if (!existsSheet && !!state.uploaded) {
                const sheetToAdd = state.uploaded.worksheets.find(x => x.index == changedIndex);
                if (!sheetToAdd) throw 'No sheet found';
                updatedSheetsSchemes[sheetToAdd.index] = {
                  name: sheetToAdd.title,
                  type: EnumAppDatasetProcessType.training,
                  cols: IM.transform<SourceGoogleWorksheetCol, SourceGoogleScheetColScheme>(({ key, value }) => ({
                    key: key,
                    value: {
                      title: value.title,
                      colIndex: value.originalIndex,
                      colType: EnumAppDatasetColType.number,
                      decimals: value.decimals,
                      isInclude: false,
                      isOutput: false,
                      originIndex: value.originalIndex,
                      preview: value.values?.slice(0, Math.min(value.values.length, 3)) ?? []
                    } as SourceGoogleScheetColScheme
                  }))(sheetToAdd.cols)
                };
              } else {
                delete updatedSheetsSchemes[changedIndex];
              }
              return updatedSheetsSchemes;
            },
            (reason) => createAppError({ message: String(reason) })
          )
        ),
        E.fold(
          (error) => {
            NS.toastError(error);
            _commitState(commit, state, {
              error: error
            })(null);
          },
          (map) => {
            _commitState(commit, state, {
              error: null,
              scheme: {
                ...state.scheme,
                sheets: map
              }
            })(null);
          }
        )
      );
    });
  },

  [EnumStoreDatasetUploadActions.updateColumn]: ({ commit, state }, payload: {
    worksheetIndex: number;
    col: SourceGoogleScheetColScheme;
  }) => {
    E.tryCatch(
      () => {
        const worksheet = { ...state.scheme.sheets[payload.worksheetIndex] };
        const cols = IM.clone(worksheet.cols);
        cols[payload.col.originIndex] = payload.col;
        _commitState(commit, state, {
          scheme: {
            ...state.scheme,
            sheets: {
              ...state.scheme.sheets,
              [payload.worksheetIndex]: {
                ...worksheet,
                cols: cols
              }
            }
          }
        })(null);
      },
      (reason) => NS.toastError(createAppError({ message: String(reason) }))
    );
  },

  [EnumStoreDatasetUploadActions.updateWorksheetMetadata]: ({ commit, state }, payload: { scheme: Partial<SourceGoogleSheetWorksheetScheme>; worksheetIndex: number }) => {
    _commitState(commit, state, {
      ...state,
      scheme: {
        ...state.scheme,
        sheets: {
          ...state.scheme.sheets,
          [payload.worksheetIndex]: {
            ...state.scheme.sheets[payload.worksheetIndex],
            ...payload.scheme
          }
        }
      }
    })(null);
  },

  [EnumStoreDatasetUploadActions.save]: ({ state }): onSaveActionResponse =>
    F.pipe(
      state.scheme,
      E.fromNullable(createAppError({ message: 'Scheme is null' })),
      E.chain(state =>
        F.pipe(
          state.sheets,
          E.fromNullable(createAppError({ message: 'No worksheets selected' })),
          E.map(s => IM.getValues(s)),
          E.map(sheets => {
            if (sheets.map(sourceGoogleSheetWorksheetSchemeValidator).find(E.isLeft)) {
              return E.left(createAppError({ message: 'Schemas contains errors' }));
            }

            return E.right(state);
          })
        )
      ),
      E.chain(
        E.map(scheme =>
          F.pipe(
            state.uploaded,
            E.fromNullable(createAppError({ message: 'Source is null' })),
            E.map(googleSheetToSource(scheme)),
            E.flatten
          )
        )
      ),
      E.chain(E.map((datasets) => datasets.map(x => writeDataset(x)))),
      E.mapLeft(x => [x]),
    ),

  [EnumStoreDatasetUploadActions.reset]: ({ commit }) => {
    commit(EnumStoreDatasetUploadMutations.update, defaultState());
  }
};

export const storeDatasetUploadModule: Module<StoreDatasetUploadState, AppState> = {
  namespaced: true,
  state: defaultState,
  getters: getters,
  mutations: mutations,
  actions: actions
};
