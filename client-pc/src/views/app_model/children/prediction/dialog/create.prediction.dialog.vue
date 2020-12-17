<template>
  <q-dialog ref="dialog" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="q-dialog-plugin root-card">
      <q-card-section>
        <q-select
          :options="datasets"
          v-model="selectedDataset"
          option-disable="disabled"
          emit-value
          @input="onDatasetSelect"
          label="Dataset"
          filled
        >
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
              <q-item-section>
                <q-item-label>{{ scope.opt.metadata.name }}</q-item-label>
                <q-item-label caption>{{ scope.opt.type }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                {{ scope.opt.metadata.updatedTime | appTime }}
              </q-item-section>
            </q-item>
          </template>
          <template v-slot:selected v-if="selectedDataset">
            <span
              >{{ selectedDataset.type }} :
              {{ selectedDataset.metadata.name }}</span
            >
          </template>
        </q-select>
      </q-card-section>
      <q-card-actions align="between">
        <q-btn flat @click="onCancelClick" label="Cancel" />
        <q-btn
          text-color="white"
          color="primary"
          @click="onOkClick"
          :disable='isCreateDisabled'
          label="Create"
        >
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { EnumAppDatasetProcessType } from '@/infrastructure/dataset';
import { QDialog } from 'quasar';
import { Component, Prop } from 'vue-property-decorator';
import {
  AppDatasetInfo,
  AppModelPredictionMetadataCreateModel
} from '../children/list/store';

const _defaultModel = (): AppModelPredictionMetadataCreateModel => ({
  datasetId: '',
  datasetName: '',
  isValidation: false
});

@Component
export default class CreatePredictionDialog extends QDialog {
  $refs!: {
    dialog: QDialog;
  };

  @Prop()
  datasets!: AppDatasetInfo[];

  model: AppModelPredictionMetadataCreateModel = _defaultModel();
  selectedDataset: AppDatasetInfo | null = null;

  show() {
    this.$refs.dialog.show();
  }

  hide() {
    this.$refs.dialog.hide();
  }

  onDialogHide() {
    this.$emit('hide');
  }

  onOkClick() {
    if (this.isCreateDisabled) return;

    this.$emit('ok', this.model);
    this.hide();
  }

  onCancelClick() {
    this.hide();
  }

  onDatasetSelect($event: AppDatasetInfo) {
    this.model = {
      datasetId: $event.metadata.id,
      datasetName: $event.metadata.name,
      isValidation: $event.type == EnumAppDatasetProcessType.validation
    };
  }

  get isCreateDisabled(): boolean {
    const nullOrEmpty = (s: string | null) => !s || s == null || !s.trim().length;

    if (!this.model) return true;
    if (nullOrEmpty(this.model.datasetId) || nullOrEmpty(this.model.datasetName)) return true;
    return false;
  }
}
</script>

<style lang="scss" scoped>
.root-card {
  min-width: 600px;
}
</style>