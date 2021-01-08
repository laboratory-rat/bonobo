<template>
  <div v-if="model != null">
    <div class="q-mb-md row wrap q-col-gutter-md">
      <div class="col-6">
        <q-select
          dense
          :options="optionsModelTypes"
          v-model="selectedModelType"
          disable
          label="Type"
          option-label="label"
          option-value="key"
          map-options
          emit-value
          filled
        />
      </div>
      <div class="col-6">
        <q-select
          dense
          label="Algorithm"
          :options="optionsModelSubtypes"
          v-model="selectedModelSubtype"
          option-label="label"
          option-value="key"
          map-options
          emit-value
          @input="onAlgorithmChanged()"
          filled
        />
      </div>
      <div class="col-12">
        <q-input
          dense
          label="Model name *"
          filled
          debounce="300"
          @input="emitUpdate()"
          v-model="model.name"
        />
      </div>
      <div class="col-6">
        <q-input
          type="number"
          filled
          dense
          v-model.number="model.trainingSplit"
          label="Training split *"
        />
      </div>
      <div class="col-6">
        <q-input
          type="number"
          filled
          dense
          v-model="model.trainingEpochsLimit"
          label="Epochs limit *"
        />
      </div>
    </div>
    <div class="">
      <div v-if="selectedModelType == enumAppModelType.sequential">
        <option-sequential-simple
          v-if="selectedModelSubtype == enumAppModelSubtype.simple"
          v-model="model.options"
        />
        <option-sequential-lstm
          v-else-if="selectedModelSubtype == enumAppModelSubtype.lstm"
          v-model="model.options"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  AppModel,
  createAppModelFromDatasetMetadata,
  EnumAppModelSubtype,
  EnumAppModelSubtypesList,
  EnumAppModelType,
  EnumAppModelTypesList
} from '@/infrastructure/app_model';
import { appModelOptionsSelect } from '@/infrastructure/app_model/options/AppModelOptions';
import { KeyLabelStringIterable } from '@/infrastructure/core';
import { AppDatasetMetadata } from '@/infrastructure/dataset';
import Vue from 'vue';
import { Component, Emit, PropSync, Watch } from 'vue-property-decorator';
import OptionSequentialLstm from './options_forms/sequential/OptionSequentialLstm.component.vue';
import OptionSequentialSimple from './options_forms/sequential/OptionSequentialSimple.component.vue';

@Component({
  components: {
    OptionSequentialLstm,
    OptionSequentialSimple
  }
})
export default class AppModelCreateComponent extends Vue {
  @PropSync('metadata')
  syncMetadata!: AppDatasetMetadata;

  model: AppModel | null = null;

  selectedModelType: EnumAppModelType = EnumAppModelType.sequential;
  selectedModelSubtype: EnumAppModelSubtype = EnumAppModelSubtype.simple;

  get enumAppModelSubtype(): typeof EnumAppModelSubtype {
    return EnumAppModelSubtype;
  }

  get enumAppModelType(): typeof EnumAppModelType {
    return EnumAppModelType;
  }

  get optionsModelSubtypes(): KeyLabelStringIterable<EnumAppModelSubtype>[] {
    return EnumAppModelSubtypesList;
  }

  get optionsModelTypes(): KeyLabelStringIterable<EnumAppModelType>[] {
    return EnumAppModelTypesList;
  }

  @Watch('selectedModelType')
  _watchSelectedModelType() {
    this.selectedModelSubtype = EnumAppModelSubtype.lstm;
  }

  @Emit('update')
  emitUpdate() {
    return this.model;
  }

  mounted() {
    this.onAlgorithmChanged();
  }

  onAlgorithmChanged() {
    this.model = createAppModelFromDatasetMetadata(this.syncMetadata, {
      name: this.model?.name ?? '',
      trainingEpochsLimit: this.model?.trainingEpochsLimit ?? 100,
      type: this.selectedModelType,
      subtype: this.selectedModelSubtype,
      trainingSplit: 0.3,
      options: appModelOptionsSelect({
        type: this.selectedModelType,
        subtype: this.selectedModelSubtype
      })
    });
    this.emitUpdate();
  }
}
</script>
