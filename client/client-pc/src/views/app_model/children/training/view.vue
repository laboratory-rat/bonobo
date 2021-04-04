<template>
  <div>
    <q-page padding class="page-training">
      <div class="text-h5">Training:</div>
      <q-card v-if="!!appModel" class="q-mt-md">
        <q-card-section class="flex justify-between q-pa-sm">
          <div>
            <div class="text-subtitle1">{{ appModel.name }}</div>
            <div class="text-caption">
              {{ appModel.type }} | {{ appModel.subtype }}
            </div>
          </div>
          <div class="self-center">
            <q-btn-group outline>
              <q-btn
                color="primary"
                outline
                icon="memory"
                :label="trainButtonLabel"
                :disable="isInProgress"
                @click="onClickTrain()"
              />
              <q-btn outline icon="menu">
                <q-menu transition-show="jump-down" transition-hide="jump-up">
                  <q-list style="min-width: 100px">
                    <q-item
                      clickable
                      v-close-popup
                      @click="onClickClone(false)"
                      :disable="cloneInProgress"
                    >
                      <q-item-section>Clone</q-item-section>
                    </q-item>
                    <q-item
                      clickable
                      v-close-popup
                      @click="onClickClone(true)"
                      :disable="cloneInProgress"
                    >
                      <q-item-section>Clone and DELETE</q-item-section>
                    </q-item>
                    <q-item
                      clickable
                      v-close-popup
                      @click="isModelInfoExpanded = !isModelInfoExpanded"
                    >
                      <q-item-section>
                        <span v-if="isModelInfoExpanded">Hide info</span>
                        <span v-else>Show info</span>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </q-btn-group>
          </div>
        </q-card-section>
        <q-slide-transition>
          <div v-show="isModelInfoExpanded">
            <q-separator />
            <json-tree :level="1" :data="appModel" />
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
      <q-page-sticky position="bottom-right" :offset="[8, 8]">
        <q-btn
          fab
          padding="sm"
          icon="navigate_before"
          @click="onBackClick"
          color="accent"
        />
      </q-page-sticky>
    </q-page>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import {
  EnumStoreAppModelTrainingGetters as getters,
  EnumStoreAppModelTrainingActions as actions
} from './store';
import * as AM from '@/infrastructure/app_model';
import TrainingProcessDisplayChartComponent from '@/views/app_model/components/charts/TrainingProcessDisplayChart.component.vue';
import { AppModel, AppModelHistory } from '@/infrastructure/app_model';
import JsonTree from 'vue-json-tree';
import AppModelCreateDialog from '@/views/app_model/dialogs/create.dialog.vue';
import { getAppDI } from '@/di/AppDI';
import * as E from 'fp-ts/Either';
import * as F from 'fp-ts/function';
import { createAppError, generageId } from '@/infrastructure/core';
import * as NS from '@/infrastructure/services/NotifyService';
import { AppDatasetMetadata } from '@/infrastructure/dataset';

const store = namespace('model/training');

// TODO: Remove this! Do not upload all metadata list to select one!
const datasetRepository = () => getAppDI().datasetRepository;

@Component({
  components: {
    TrainingProcessDisplayChartComponent,
    JsonTree
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

  async onClickTrain() {
    await this._actionCreateTFModel();
  }

  cloneInProgress = false;
  async onClickClone(del = false) {
    const modelID = this.appModelId;
    if (this.cloneInProgress) {
      return;
    }

    this.cloneInProgress = true;
    const metadata = await datasetRepository().List({
      limit: 1000,
      startAfter: ''
    })();

    if (E.isLeft(metadata)) {
      console.error(metadata.left);
    } else if (E.isRight(metadata)) {
      this.$q
        .dialog({
          parent: this,
          component: AppModelCreateDialog,
          metadata: (metadata.right as AppDatasetMetadata[]).filter(
            x => x.id == this.appModel?.datasetId
          )[0],
          baseModel: {
            ...(JSON.parse(JSON.stringify(this.appModel)) as AppModel),
            id: generageId(8),
            name: this.appModel?.name + ' clone'
          }, // TODO: update this to general function
          noBackdropDismiss: true
        })
        .onOk((model: AppModel) => {
          const _create = () => F.pipe(
            model,
            E.fromNullable(createAppError({ message: 'App model is null' })),
            E.map(AM.writeAppModel),
            E.fold(NS.toastError, () => {
              this.onMount(model.id);
            })
          );



          if (del) {
            F.pipe(
              {id: modelID},
              AM.deleteAppModelFolder,
              E.fold(NS.toastError, _ => {
                _create();
              })
            );
          } else {
            _create();
          }
        });
    }

    this.cloneInProgress = false;
  }

  onBackClick() {
    this.$router.back();
  }

  mounted() {
    this.onMount(this.$route.params.id);
  }

  onMount(id: string) {
    console.log('On mount ', id);
    this._actionSetModel({ id });
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
