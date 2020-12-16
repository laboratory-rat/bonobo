<template>
  <q-dialog ref="dialog" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="q-dialog-plugin root-card">
      <q-card-section></q-card-section>
      <q-card-actions align="between">
        <q-btn flat @click="onCancelClick" label="Cancel" />
        <q-btn
          text-color="white"
          color="primary"
          @click="onOkClick"
          label="Create"
        >
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator';
import { QDialog } from 'quasar';

@Component
export default class AppModelCreateDialog extends QDialog {
  $refs!: {
    dialog: QDialog;
  };

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
    this.$emit('ok');
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