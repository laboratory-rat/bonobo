<template>
  <div v-if="data && model">
    <q-table
      :columns="tableColumns"
      :data="model.header"
      selection="multiple"
      row-key="originIndex"
      :selected.sync='selected'
      :pagination="{}"
      :rows-per-page-options="[0]"
      :title="'Worksheet ' + model.name"
    >
      <template v-slot:top>
        <div class="row q-col-gutter-md full-width">
          <div class="col-6">
            <q-input
              v-model.trim="model.name"
              dense
              filled
              debounce="300"
              @input="emitModelUpdate"
            />
          </div>
          <div class="col-6">
            <q-select
              :options="datasetTypeOptions"
              :value="model.datasetProcessType"
              filled
              option-value="key"
              option-label="label"
              emit-value
              map-options
              dense
              @input="onDatasetTypeChange"
            />
          </div>
        </div>
      </template>
      <template v-slot:body-cell-title="props">
        <q-td :props="props">
          <div>
            <q-input
              filled
              dense
              debounce="200"
              v-model.trim="props.row.title"
              @input="emitModelUpdate"
            />
          </div>
        </q-td>
      </template>
      <template v-slot:body-cell-examples="props">
        <q-td :props="props">
          <div
            v-for="(r, $r) in data.examples"
            :key="'ex-' + $r + '-' + props.key"
          >
            <q-chip v-text="r.value[props.key].value[0]" square dense color='' size="md" outline />
          </div>
        </q-td>
      </template>
      <template v-slot:body-cell-type="props">
        <q-td :props="props">
          <q-select
            :options="datasetColTypeOptions"
            :value="getColTypeByOriginIndex(props.row.originIndex)"
            filled
            readonly
            option-value="key"
            option-label="label"
            emit-value
            map-options
            dense
          />
        </q-td>
      </template>

      <template v-slot:body-cell-decimals="props">
        <q-td :props="props">
          <div>
            <q-input
              filled
              debounce="300"
              v-model.number="props.row.decimals"
              type="number"
              @input="emitModelUpdate"
              dense
            />
          </div>
        </q-td>
      </template>
      <template v-slot:body-cell-isOutput="props">
        <q-td :props="props">
          <div>
            <q-checkbox v-model="props.row.isOutput" @input="emitModelUpdate" />
          </div>
        </q-td>
      </template>
      <template v-slot:bottom v-if='!saved'>
          <q-btn color='primary' @click='emitModelApprove'>Approve</q-btn>
      </template>
    </q-table>
    <q-inner-loading :showing="model.isLoading">
      <q-spinner-gears size="50px" color="primary" />
    </q-inner-loading>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Prop, Emit, Watch, PropSync } from 'vue-property-decorator';
import Component from 'vue-class-component';
import {
  AppDatasetApprove,
  AppDatasetApproveHeader,
  AppDatasetMetadata,
  enumAppDatasetTypeList,
  enumAppDatasetColTypeList, EnumAppDatasetMetadataProcessType
} from '@/infrastructure/dataset';
import { AppDatasetApproveSelected } from '@/views/dataset/children/upload/store';

@Component
export default class SchemeUpdateComponent extends Vue {
  @Prop({ required: true })
  data!: AppDatasetMetadata;

  @Prop({ required: true })
  approveModel!: AppDatasetApproveSelected;

  @Prop({required: true, default: () => false})
  saved!: boolean;

  datasetTypeOptions = enumAppDatasetTypeList();
  datasetColTypeOptions = enumAppDatasetColTypeList()

  model: AppDatasetApproveSelected | null = null;
  selected: AppDatasetApproveHeader[] = [];

  getColTypeByOriginIndex(index: number) {
    return this.data.header.find(x => x.originIndex == index)?.type;
  }

  @Watch('approveModel')
  _watchOnApproveModel(m: AppDatasetApproveSelected) {
    this.model = {
      ...m,
      header: m.header.map(x => ({ ...x })),
      selected: [...m.selected]
    };

    this.selected = this.model.header.filter(x => this.model!.selected.indexOf(x.originIndex) != -1);
  }

  @Watch('selected')
  _watchOnSelected(d: AppDatasetApproveHeader[]) {
    if (!this.model || this.model.selected.length == this.selected.length) {
      return;
    }

    this.model.selected = this.selected.map(x => x.originIndex);
    this.emitModelUpdate();
  }

  tableColumns = [
    {
      name: 'index',
      label: 'Index',
      align: 'left',
      field: (row: AppDatasetApproveHeader) => row.index
    },
    {
      name: 'title',
      label: 'Title',
      align: 'left'
    },
    {
      name: 'examples',
      label: 'Examples',
      align: 'left'
    },
    {
      name: 'type',
      label: 'Type',
      align: 'left'
    },
    {
      name: 'decimals',
      label: 'Decimals',
      align: 'left'
    },
    {
      name: 'isOutput',
      label: 'Is output',
      align: 'left'
    }
  ];

  @Emit('model:update')
  emitModelUpdate() {
    return this.model;
  }

  @Emit('model:approve')
  emitModelApprove() {
    return this.data.id;
  }

  mounted() {
    this._watchOnApproveModel(this.approveModel);
  }

  onDatasetTypeChange(type: EnumAppDatasetMetadataProcessType) {
    if (!this.model) {
      return;
    }

    this.model.datasetProcessType = type;
    this.emitModelUpdate();
  }
}
</script>

<style scoped></style>
