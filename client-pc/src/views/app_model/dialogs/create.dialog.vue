<template>
  <q-dialog ref="dialog" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="q-dialog-plugin root-card">
      <q-card-section>
        <app-model-create-component :metadata="metadata" @update="onUpdate" />
      </q-card-section>
      <q-card-actions align="between">
        <q-btn flat @click="onCancelClick">Cancel</q-btn>
        <q-btn text-color="white" color="primary" @click="onOkClick"
          >Create</q-btn
        >
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import AppModelCreateComponent from '../components/AppModelCreate.component.vue';
import { QDialog } from 'quasar';
import { AppDatasetMetadata } from '@/infrastructure/dataset';
import { AppModel } from '@/infrastructure/app_model';

@Component({
  components: {
    AppModelCreateComponent
  }
})
export default class AppModelCreateDialog extends QDialog {
  $refs!: {
    dialog: QDialog;
  };

  @Prop()
  metadata!: AppDatasetMetadata;

  model: AppModel | null = null;

  onUpdate(model: AppModel) {
    this.model = model;
  }

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
    this.$emit('ok', this.model);
    this.hide();
  }

  onCancelClick() {
    this.hide();
  }
}
</script>

<style lang="scss" scoped>
.root-card {
  min-width: 800px;
}
</style>