<template>
  <div>
    <q-page padding>
      <q-toolbar v-if="metadata">
        <q-toolbar-title
          >Prediction for: {{ metadata.modelName }} /
          {{ metadata.datasetName }}</q-toolbar-title
        >
        <q-space></q-space>
        <div>
          <q-btn
            icon="edit"
            flat
            :disable="isInProgress"
            @click="onRestartClick"
          />
        </div>
      </q-toolbar>
      <div class="q-mt-md" v-if="isInProgress">
        Calculations in progress
      </div>
      <div class="q-mt-md" v-if="result">
        <validation-display-chart-component :result="result" ></validation-display-chart-component>
      </div>
      <div v-if='result'>
        <q-card class='q-mt-md'>
          <q-card-section>
            <div v-if='result.correctData'>
              <b>correct:</b>
              <br>
              {{result.correctData.map(x => x[0])}}
            </div>
            <br>
            <div>
              <b>response:</b>
              <br>
              {{result.outputData.map(x => x[0])}}
            </div>

          </q-card-section>
        </q-card>
      </div>
    </q-page>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import {
  EnumStoreGetters as getters,
  EnumStoreActions as actions
} from './store';
import * as AM from '@/infrastructure/app_model';
import {
  AppModel,
  AppModelPredictionMetadata
} from '@/infrastructure/app_model';
import ValidationDisplayChartComponent from '@/views/app_model/components/charts/ValidationDisplayChart.component.vue';

const store = namespace('model/prediction/explore');

@Component({
  components: {
    ValidationDisplayChartComponent
  }
})
export default class AppModelPredictionExploreView extends Vue {
  @store.Action(actions.init)
  _actionInit!: (payload: { modelId: string; predictionId: string }) => void;

  @store.Action(actions.process)
  _actionProcess!: () => Promise<unknown>;

  @store.Getter(getters.isInProgress)
  isInProgress!: boolean;

  @store.Getter(getters.model)
  model!: AppModel | null;

  @store.Getter(getters.result)
  result!: AM.AppModelPredictionResult | null;

  @store.Getter(getters.metadata)
  metadata!: AppModelPredictionMetadata | null;

  onRestartClick() {
    this._actionProcess().then(this._rebuildCharts);
  }

  _rebuildCharts() {
    if (!this.result) {
      return;
    }
  }

  mounted() {
    this._actionInit({
      modelId: this.$route.params.id,
      predictionId: this.$route.params.predictionId
    });

    if (this.result == null) {
      this._actionProcess().then(this._rebuildCharts);
    }
  }
}
</script>
