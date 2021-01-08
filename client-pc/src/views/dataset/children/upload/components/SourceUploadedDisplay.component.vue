<!--<template>-->
<!--  <div v-if="data">-->
<!--    <q-table-->
<!--      selection="multiple"-->
<!--      row-key="index"-->
<!--      :columns="cols"-->
<!--      :data="dataAsList"-->
<!--      :selected-rows-label="() => ''"-->
<!--      :selected.sync="selected"-->
<!--      :pagination="{}"-->
<!--      :rows-per-page-options="[0]"-->
<!--      :title="'Document: ' + data.id"-->
<!--    />-->
<!--  </div>-->
<!--</template>-->

<!--<script lang="ts">-->
<!--import {-->
<!--  SourceGoogleSheet,-->
<!--  SourceGoogleWorksheet-->
<!--} from '@/infrastructure/source/google/GoogleSheet';-->
<!--import Vue from 'vue';-->
<!--import { Component, Emit, Prop, Watch } from 'vue-property-decorator';-->
<!--import * as IM from '@/infrastructure/core/IndexedMap';-->

<!--const _datatableCols = [-->
<!--  {-->
<!--    name: 'title',-->
<!--    label: 'Title',-->
<!--    align: 'left',-->
<!--    field: (row: SourceGoogleWorksheet) => row.title-->
<!--  },-->
<!--  {-->
<!--    name: 'id',-->
<!--    label: 'Id',-->
<!--    align: 'left',-->
<!--    field: (row: SourceGoogleWorksheet) => row.id-->
<!--  },-->
<!--  {-->
<!--    name: 'index',-->
<!--    label: 'Index',-->
<!--    align: 'left',-->
<!--    field: (row: SourceGoogleWorksheet) => row.index-->
<!--  },-->
<!--  {-->
<!--    name: 'cols',-->
<!--    label: 'Cols',-->
<!--    align: 'left',-->
<!--    field: (row: SourceGoogleWorksheet) => IM.length(row.cols)-->
<!--  },-->
<!--  {-->
<!--    name: 'rows',-->
<!--    label: 'Rows',-->
<!--    align: 'left',-->
<!--    field: (row: SourceGoogleWorksheet) => {-->
<!--      const sizes = IM.getValues(row.cols).map(x => x.values.length);-->
<!--      const min = Math.min(...sizes);-->
<!--      const max = Math.max(...sizes);-->
<!--      return min == max ? `${min}` : `${min} - ${max}`;-->
<!--    }-->
<!--  }-->
<!--];-->

<!--@Component-->
<!--export default class SourceUploadedDisplayComponent extends Vue {-->
<!--  @Prop()-->
<!--  data!: SourceGoogleSheet | null;-->

<!--  selectedIndexes: number[] = [];-->
<!--  selected: SourceGoogleWorksheet[] = [];-->

<!--  get cols(): unknown {-->
<!--    return _datatableCols;-->
<!--  }-->

<!--  get dataAsList(): SourceGoogleWorksheet[] {-->
<!--    return this.data -->
<!--      ? this.data.worksheets-->
<!--      : [];-->
<!--  }-->

<!--  @Watch('data')-->
<!--  _watchData() {-->
<!--    this.selectedIndexes = [];-->
<!--    this.selected = [];-->
<!--  }-->

<!--  @Watch('selected')-->
<!--  _watchSelected(selected: SourceGoogleWorksheet[]) {-->
<!--    this.selectedIndexes = selected?.map(x => x.index) ?? [];-->
<!--    this.update();-->
<!--  }-->

<!--  @Emit()-->
<!--  update() {-->
<!--    return this.selectedIndexes;-->
<!--  }-->
<!--}-->
<!--</script>-->
