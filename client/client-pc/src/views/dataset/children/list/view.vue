<template>
  <div>
    <q-page padding>
      <div class="text-h5">Available datasets:</div>
      <div class="row q-col-gutter-md q-mt-sm">
        <div v-for="meta in list" :key="meta.id" class="col-6">
          <q-card class="cursor-pointer">
            <q-card-section>
              <div class="flex justify-between">
                <div>
                  <div class="text-subtitle2">{{ meta.name }}</div>
                  <div class="text-caption">{{ meta.datasetProcessType }}</div>
                </div>
                <div class="text-subtitle2 text-grey">
                  {{ meta.updatedTime | appTime }}
                </div>
              </div>
              <div class="q-mt-sm">
                <div>
                  Cols: {{meta.header.filter(x => !x.isOutput).length}} + {{meta.header.filter(x => x.isOutput).length}}
                </div>
                <div>Size: {{meta.size}}</div>
                <div>Source: {{ meta.sourceType }}</div>
              </div>
            </q-card-section>
            <q-menu touch-position>
              <q-list style="min-width: 100px">
                <template v-if='isDatasetTrain(meta)'>

                <q-item
                  clickable
                  v-close-popup
                  @click="onCreateModelClick(meta)"
                >
                  <q-item-section>Create model</q-item-section>
                </q-item>
                </template>
                <template v-else-if='isDatasetValidate'>
                  <q-item clickable v-close-popup>
                    <q-item-section>Validate</q-item-section>
                  </q-item>
                </template>

                <q-item clickable v-close-popup>
                  <q-item-section>View</q-item-section>
                </q-item>
                <q-separator />
                <q-item
                  @click="onDeleteClick(meta)"
                  clickable
                  v-close-popup
                  class="text-red"
                >
                  <q-item-section>Delete</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-card>
        </div>
      </div>
      <q-page-sticky position="bottom-right" :offset="[24, 24]">
        <q-btn fab icon="add" color="accent" :to="{ name: 'dataset-upload' }" />
      </q-page-sticky>
    </q-page>
  </div>
</template>

<script lang="ts">
import { AppDatasetMetadata, EnumAppDatasetMetadataProcessType } from '@/infrastructure/dataset';
import Vue from 'vue';
import Component from 'vue-class-component';
import { Action, Getter } from 'vuex-class';
import { EnumStoreDatasetListActions as actions, EnumStoreDatasetListGetters as getters } from './store';
import AppModelCreateDialog from '../../../app_model/dialogs/create.dialog.vue';
import * as AM from '@/infrastructure/app_model';
import * as E from 'fp-ts/Either';
import * as F from 'fp-ts/function';
import { createAppError } from '@/infrastructure/core';
import * as NS from '@/infrastructure/services/NotifyService';

const STORE = 'dataset/list';

@Component
export default class DatasetListView extends Vue {
  @Getter(`${STORE}/${getters.isLoading}`)
  isLoading!: boolean;

  @Getter(`${STORE}/${getters.list}`)
  list!: AppDatasetMetadata[];

  @Action(`${STORE}/${actions.refresh}`)
  _actionRefresh!: () => void;

  @Action(`${STORE}/${actions.deleteById}`)
  _actionDeleteDatasetById!: (payload: { id: string }) => void;

  isDatasetTrain(dataset: AppDatasetMetadata): boolean {
    return dataset.datasetProcessType == EnumAppDatasetMetadataProcessType.training;
  }

  isDatasetValidate(dataset: AppDatasetMetadata): boolean {
    return dataset.datasetProcessType == EnumAppDatasetMetadataProcessType.validation;
  }

  onCreateModelClick(metadata: AppDatasetMetadata) {
    this.$q
      .dialog({
        parent: this,
        component: AppModelCreateDialog,
        metadata,
        noBackdropDismiss: true
      })
      .onOk((model: AM.AppModel) =>
        F.pipe(
          model,
          E.fromNullable(createAppError({ message: 'App model is null' })),
          e => {
            console.log(e);
            return e;
          },
          E.chain(AM.writeAppModel),
          E.fold(NS.toastError, () => {
            this.$router.push({
              name: 'model-training',
              params: {
                id: model.id
              }
            });
          })
        )
      );
  }

  onDeleteClick(metadata: AppDatasetMetadata) {
    this.$q
      .dialog({
        parent: this,
        title: `Delete dataset ${metadata.name}?`,
        message: 'This action can not reverted!',
        cancel: true,
        ok: 'DELETE',
        focus: 'cancel'
      })
      .onOk(() => {
        this._actionDeleteDatasetById(metadata);
      });
  }

  mounted() {
    this._actionRefresh();
  }
}
</script>