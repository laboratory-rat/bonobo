<!--<template>-->
<!--  <div v-if="data && worksheetIndex != null">-->
<!--    <q-table-->
<!--      :columns="columns"-->
<!--      :data="listData"-->
<!--      selection="multiple"-->
<!--      row-key="originIndex"-->
<!--      :selected-rows-label="() => ''"-->
<!--      :selected.sync="selected"-->
<!--      virtual-scroll-->
<!--      :pagination="{}"-->
<!--      :rows-per-page-options="[0]"-->
<!--      :title="'Worksheet: ' + data.name"-->
<!--      @selection="onRowsSelect"-->
<!--    >-->
<!--      <template v-slot:top>-->
<!--        <div class="row q-col-gutter-md full-width">-->
<!--          <div class="col-6">-->
<!--            <q-input-->
<!--              :value="data.name"-->
<!--              dense-->
<!--              filled-->
<!--              debounce="300"-->
<!--              @input="onSchemeNameChange"-->
<!--            />-->
<!--          </div>-->
<!--          <div class="col-6">-->
<!--            <q-select-->
<!--              :options="datasetTypesOptions"-->
<!--              :value="data.type"-->
<!--              option-value="key"-->
<!--              filled-->
<!--              option-label="label"-->
<!--              emit-value-->
<!--              map-options-->
<!--              dense-->
<!--              @input="onSchemeTypeChange"-->
<!--            />-->
<!--          </div>-->
<!--        </div>-->
<!--      </template>-->
<!--      <template v-slot:body-cell-preview="props">-->
<!--        <q-td :props="props">-->
<!--          <div>-->
<!--            <div-->
<!--              v-for="preview in props.row.preview"-->
<!--              :key="preview.originIndex"-->
<!--            >-->
<!--              <q-badge :label="preview" />-->
<!--            </div>-->
<!--          </div>-->
<!--        </q-td>-->
<!--      </template>-->
<!--      <template v-slot:body-cell-type="props">-->
<!--        <q-td :props="props">-->
<!--          <div>-->
<!--            <q-select-->
<!--              v-model="props.row.colType"-->
<!--              option-label="label"-->
<!--              option-value="key"-->
<!--              emit-value-->
<!--              map-options-->
<!--              @input="onRowUpdate(props.row)"-->
<!--              :options="colTypesOptions"-->
<!--              dense-->
<!--              filled-->
<!--            />-->
<!--          </div>-->
<!--        </q-td>-->
<!--      </template>-->
<!--      <template v-slot:body-cell-decimals="props">-->
<!--        <q-td :props="props">-->
<!--          <div>-->
<!--            <q-input-->
<!--              filled-->
<!--              debounce="300"-->
<!--              :disable="!isDecimalsActive(props.row)"-->
<!--              v-model.number="props.row.decimals"-->
<!--              type="number"-->
<!--              @input="onRowUpdate(props.row)"-->
<!--              dense-->
<!--            />-->
<!--          </div>-->
<!--        </q-td>-->
<!--      </template>-->
<!--      <template v-slot:body-cell-isOutput="props">-->
<!--        <q-td :props="props">-->
<!--          <div>-->
<!--            <q-checkbox-->
<!--              v-model="props.row.isOutput"-->
<!--              @input="onRowUpdate(props.row)"-->
<!--            />-->
<!--          </div>-->
<!--        </q-td>-->
<!--      </template>-->
<!--      <template v-slot:bottom>-->
<!--        <div class="full-width">-->
<!--          <q-banner dense rounded class="text-white bg-red" v-if="isErrors">-->
<!--            <ul>-->
<!--              <li v-for="(error, $errorIndex) in errors" :key="`error-${$errorIndex}`">{{ error }}</li>-->
<!--            </ul>-->
<!--          </q-banner>-->
<!--        </div>-->
<!--      </template>-->
<!--    </q-table>-->
<!--  </div>-->
<!--</template>-->

<!--<script lang="ts">-->
<!--import {-->
<!--  SourceGoogleScheetColScheme,-->
<!--  SourceGoogleSheetWorksheetScheme-->
<!--} from '@/infrastructure/source/google';-->
<!--import * as IM from '@/infrastructure/core/IndexedMap';-->
<!--import * as F from 'fp-ts/function';-->
<!--import * as E from 'fp-ts/Either';-->
<!--import Vue from 'vue';-->
<!--import { Component, Emit, Prop, Watch } from 'vue-property-decorator';-->
<!--import {-->
<!--  EnumAppDatasetMetadataProcessType,-->
<!--  enumAppDatasetTypeList-->
<!--} from '@/infrastructure/dataset';-->
<!--import { KeyLabelStringIterable } from '@/infrastructure/core';-->
<!--import { sourceGoogleSheetWorksheetSchemeValidator } from '@/infrastructure/source/google/validators';-->

<!--const _columns = [-->
<!--  {-->
<!--    name: 'title',-->
<!--    label: 'Title',-->
<!--    align: 'left',-->
<!--    field: (row: SourceGoogleScheetColScheme) => row.title-->
<!--  },-->
<!--  {-->
<!--    name: 'preview',-->
<!--    label: 'Preview',-->
<!--    align: 'left',-->
<!--    field: (row: SourceGoogleScheetColScheme) => row.preview.join(', ')-->
<!--  },-->
<!--  {-->
<!--    name: 'type',-->
<!--    label: 'Type',-->
<!--    align: 'left',-->
<!--    field: (row: SourceGoogleScheetColScheme) => row.colType-->
<!--  },-->
<!--  {-->
<!--    name: 'decimals',-->
<!--    label: 'Decimals',-->
<!--    align: 'left',-->
<!--    field: (row: SourceGoogleScheetColScheme) => row.decimals ?? 0-->
<!--  },-->
<!--  {-->
<!--    name: 'isOutput',-->
<!--    label: 'Is output',-->
<!--    align: 'left',-->
<!--    field: (row: SourceGoogleScheetColScheme) => String(row.isOutput)-->
<!--  }-->
<!--];-->

<!--const _colTypesOptions = enumAppDatasetColTypeList();-->

<!--const _datasetTypesOptions = enumAppDatasetTypeList();-->

<!--@Component-->
<!--export default class SourceUploadedWorksheetDisplayComponent extends Vue {-->
<!--  @Prop()-->
<!--  data!: SourceGoogleSheetWorksheetScheme;-->

<!--  @Prop()-->
<!--  worksheetIndex!: number;-->

<!--  @Watch('data')-->
<!--  _watchDataChange(data: SourceGoogleSheetWorksheetScheme) {-->
<!--    if (data) {-->
<!--      F.pipe(-->
<!--        data,-->
<!--        sourceGoogleSheetWorksheetSchemeValidator,-->
<!--        E.fold(-->
<!--          errors => (this.errors = errors.map(x => x.message)),-->
<!--          () => (this.errors = [])-->
<!--        )-->
<!--      );-->
<!--    }-->
<!--  }-->

<!--  get columns(): unknown {-->
<!--    return _columns;-->
<!--  }-->

<!--  get listData(): SourceGoogleScheetColScheme[] {-->
<!--    return IM.getEntities(this.data.cols).map(x => ({ ...x.value }));-->
<!--  }-->

<!--  get colTypesOptions(): KeyLabelStringIterable<EnumAppDatasetColType>[] {-->
<!--    return _colTypesOptions;-->
<!--  }-->

<!--  get datasetTypesOptions(): KeyLabelStringIterable<-->
<!--    EnumAppDatasetMetadataProcessType-->
<!--  >[] {-->
<!--    return _datasetTypesOptions;-->
<!--  }-->

<!--  selected: unknown[] = [];-->

<!--  errors: string[] = [];-->
<!--  get isErrors(): boolean {-->
<!--    return this.errors.length > 0;-->
<!--  }-->

<!--  isDecimalsActive(row: SourceGoogleScheetColScheme) {-->
<!--    return row.colType == EnumAppDatasetColType.number && row.isInclude;-->
<!--  }-->

<!--  onRowsSelect($event: {-->
<!--    rows: SourceGoogleScheetColScheme[];-->
<!--    added: boolean;-->
<!--  }) {-->
<!--    $event.rows.forEach(col =>-->
<!--      this.update({-->
<!--        ...col,-->
<!--        isInclude: $event.added-->
<!--      })-->
<!--    );-->
<!--  }-->

<!--  onRowUpdate($event: SourceGoogleScheetColScheme) {-->
<!--    if ($event.decimals != null && $event.decimals < 0) {-->
<!--      $event.decimals = 0;-->
<!--    }-->

<!--    this.update({-->
<!--      ...$event-->
<!--    });-->
<!--  }-->

<!--  onSchemeTypeChange($event: EnumAppDatasetMetadataProcessType) {-->
<!--    this.updateWorksheet({-->
<!--      type: $event-->
<!--    });-->
<!--  }-->

<!--  onSchemeNameChange($event: string) {-->
<!--    this.updateWorksheet({-->
<!--      name: $event?.trim() ?? ''-->
<!--    });-->
<!--  }-->

<!--  @Emit()-->
<!--  update(col: SourceGoogleScheetColScheme) {-->
<!--    return col;-->
<!--  }-->

<!--  @Emit()-->
<!--  updateWorksheet(sheet: Partial<SourceGoogleSheetWorksheetScheme>) {-->
<!--    return sheet;-->
<!--  }-->
<!--}-->
<!--</script>-->
