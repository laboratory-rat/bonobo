<template>
  <div>
    <q-page padding class="page-training">
      <div class="text-h5">Training:</div>
      <q-card v-if="!!appModel" class="q-mt-md">
        <q-card-section class="flex justify-between q-pa-sm">
          <div>
            <div class="text-subtitle1">{{ appModel.name }}</div>
            <div class="">{{ appModel.type }} | {{ appModel.subtype }}</div>
            <div>created: {{ appModel.createdTime | appTime }}</div>
          </div>
          <div class="self-center">
            <q-btn
              color="primary"
              :label="trainButtonLabel"
              :disable="isInProgress"
              @click="onClickTrain()"
            />
            <q-btn
              color="light-blue"
              class="q-ml-md"
              label="Show / hide info"
              @click="isModelInfoExpanded = !isModelInfoExpanded"
            />
          </div>
        </q-card-section>
        <q-slide-transition>
          <div v-show="isModelInfoExpanded">
            <q-separator />
            <div class="q-pa-sm">
              {{ appModel }}
            </div>
          </div>
        </q-slide-transition>
      </q-card>
      <div class="q-mt-md">
        <q-card class="chart-card">
          <training-process-display-chart-component :history="trainHistory">
            <template v-slot:title>
              <span>Training process</span>
            </template>
          </training-process-display-chart-component>
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
  EnumStoreAppModelTrainingGetters as getters,
  EnumStoreAppModelTrainingActions as actions,
} from './store';
import * as AM from '@/infrastructure/app_model';
import TrainingProcessDisplayChartComponent from '@/views/app_model/components/charts/TrainingProcessDisplayChart.component.vue';
import { AppModelHistory } from '@/infrastructure/app_model';

const store = namespace('model/training');

@Component({
  components: {
    TrainingProcessDisplayChartComponent
  }
})
export default class AppModelTrainingView extends Vue {
  @store.Getter(getters.isInProgress)
  isInProgress!: boolean;

  @store.Getter(getters.appModelId)
  appModelId!: string;

  @store.Getter(getters.appModel)
  appModel!: AM.AppModel | null;

  @store.Getter(getters.appTFModel)
  appTFModel!: AM.AppTFModel | null;

  @store.Getter(getters.isTrainFinished)
  isTrainFinished!: boolean;

  @store.Getter(getters.trainHistory)
  trainHistory!: AppModelHistory | null;

  @store.Action(actions.setModel)
  _actionSetModel!: (payload: { id: string }) => void;

  @store.Action(actions.createTFModel)
  _actionCreateTFModel!: () => Promise<void>;

  get trainButtonLabel() {
    return this.isInProgress
      ? 'In progress'
      : this.appModel?.trained ?? false
      ? 'Retrain'
      : 'Train';
  }

  get isTrainStarted(): boolean {
    return !this.trainHistory;
  }

  isModelInfoExpanded = false;

  mounted() {
    this._actionSetModel({ id: this.$route.params.id });
  }

  async onClickTrain() {
    await this._actionCreateTFModel();
  }
}
</script>

<style lang="scss">
.page-training {
  .chart-card {
    min-height: 300px;
    position: relative;
  }
}
</style>