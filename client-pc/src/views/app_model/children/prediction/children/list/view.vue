<template>
  <div>
    <q-page padding>
      <div v-if="modelMetadata">
        <q-toolbar>
          <q-toolbar-title
            >Predictions of: {{ modelMetadata.name }}
          </q-toolbar-title>
          <q-space />
          <div>
            <q-btn @click="onCreateClick" color="primary" label="Create" />
          </div>
        </q-toolbar>
        <div class="q-my-md">
          Search area
        </div>
        <q-table
          :columns="tableColumns"
          :data="predictionResults"
          :pagination="pagination"
        >
          <template v-slot:body-cell-actions="props">
            <q-td class="flex justify-end">
              <q-btn icon="edit" flat @click="onEditClick(props.row)">
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </div>
    </q-page>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import {
  EnumStoreAppModelPredictionListGetters as getters,
  EnumStoreAppModelPredictionListActions as actions,
  AppPredictionStatus,
  AppDatasetInfo,
  AppModelPredictionMetadataCreateModel
} from './store';
import * as E from 'fp-ts/Either';
import * as F from 'fp-ts/function';
import * as AM from '@/infrastructure/app_model';
import * as ERR from '@/infrastructure/core/Error';
// import * as NS from '@/infrastructure/services/NotifyService';
import AppModelPredictionCreateDialog from '../../dialog/create.prediction.dialog.vue';
import * as FILTER from '@/filter/AppTimeFilter';

const store = namespace('model/prediction/list');

const predictionStatusesColumns = [
  {
    name: 'name',
    label: 'Dataset name',
    align: 'left',
    field: (row: AppPredictionStatus) => row.metadata.datasetName
  },
  {
    name: 'type',
    label: 'Type',
    align: 'left',
    field: (row: AppPredictionStatus) =>
      row.metadata.isValidation ? 'Validation' : 'Prediction'
  },
  {
    name: 'created',
    label: 'Created time',
    align: 'left',
    field: (row: AppPredictionStatus) =>
      FILTER.appTimeFilter(row.metadata.createdTime)
  },
  {
    name: 'status',
    label: 'Status',
    align: 'left',
    field: (row: AppPredictionStatus) =>
      row.metadata.finishedTime
        ? 'Finished ' + FILTER.appTimeFilter(row.metadata.finishedTime)
        : 'Not started'
  },
  {
    name: 'actions',
    align: 'right'
  }
];

const pagination = {
  sortBy: '',
  descending: false,
  page: 1,
  rowsPerPage: 20
};

@Component
export default class AppModelPredictionListView extends Vue {
  @store.Getter(getters.isInProgress)
  isInProgress!: boolean;

  @store.Getter(getters.modelMetadata)
  modelMetadata!: AM.AppModel | null;

  @store.Getter(getters.predictionsResults)
  predictionResults!: AppPredictionStatus[];

  @store.Getter(getters.datasetsStatuses)
  availableDatasets!: AppDatasetInfo[];

  @store.Action(actions.setModel)
  _actionSetModel!: (payload: { id: string }) => E.Either<unknown, unknown>;

  @store.Action(actions.refreshAvailableDatasets)
  _actionRefreshAvailableDatasets!: () => void;

  @store.Action(actions.createPredictionMetadata)
  _actionCreatePredictionMetadata!: (
    payload: AppModelPredictionMetadataCreateModel
  ) => E.Either<ERR.AppError, AM.AppModelPredictionMetadata>;

  tableColumns = predictionStatusesColumns;
  pagination = pagination;

  onCreateClick() {
    this._actionRefreshAvailableDatasets();
    this.$q
      .dialog({
        parent: this,
        component: AppModelPredictionCreateDialog,
        datasets: this.availableDatasets
      })
      .onOk(async (payload: AppModelPredictionMetadataCreateModel) => {
        const saveResult = await this._actionCreatePredictionMetadata(payload);
        if (E.isRight(saveResult)) {
          this.$router.push({
            name: 'model-prediction-explore',
            params: {
              id: saveResult.right.modelId,
              predictionId: saveResult.right.id
            }
          });
        }
      });
  }

  onEditClick($event: AppPredictionStatus) {
    if ($event && this.modelMetadata) {
      this.$router.push({
        name: 'model-prediction-explore',
        params: {
          id: this.modelMetadata.id,
          predictionId: $event.id
        }
      });
    }
  }

  mounted() {
    F.pipe(
      { id: this.$route.params.id },
      this._actionSetModel,
      E.mapLeft(() => {
        this.$router.push({ name: 'model-list' });
      })
    );
  }
}
</script>
