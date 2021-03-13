<!--<template>-->
<!--  <div>-->
<!--    <q-page padding>-->
<!--      <div class="row justify-center">-->
<!--        <div class="col-10">-->
<!--          <q-card>-->
<!--            <q-card-section>-->
<!--              <q-input-->
<!--                clearable-->
<!--                :disable="isLoading"-->
<!--                clear-icon="close"-->
<!--                outlined-->
<!--                v-model="model.id"-->
<!--                label="Sheet id"-->
<!--              >-->
<!--                <template v-slot:after>-->
<!--                  <q-btn-->
<!--                    round-->
<!--                    dense-->
<!--                    flat-->
<!--                    :disable="!model.id || !model.id.length || isLoading"-->
<!--                    icon="cloud_download"-->
<!--                    :loading="isLoading"-->
<!--                    @click="uploadSheet"-->
<!--                  />-->
<!--                </template>-->
<!--              </q-input>-->
<!--            </q-card-section>-->
<!--          </q-card>-->
<!--          <div class="q-mt-md" v-if="uploaded">-->
<!--            <q-card>-->
<!--              <source-uploaded-display-component-->
<!--                :data="uploaded"-->
<!--                @update="onUploadedWorksheetSelectedChanged"-->
<!--              />-->
<!--            </q-card>-->
<!--            <div v-if="schemeWorksheetsAsList.length">-->
<!--              <q-separator class="q-my-md" />-->
<!--              <div-->
<!--                v-for="schemeWorksheet of schemeWorksheetsAsList"-->
<!--                :key="schemeWorksheet[0]"-->
<!--              >-->
<!--                <source-uploaded-worksheet-display-component-->
<!--                  :data="schemeWorksheet[1]"-->
<!--                  :worksheetIndex="schemeWorksheet[0]"-->
<!--                  @update="col => onSchemeColUpdate(schemeWorksheet[0], col)"-->
<!--                  @update-worksheet="-->
<!--                    scheme =>-->
<!--                      onWorksheetMetadataUpdate(schemeWorksheet[0], scheme)-->
<!--                  "-->
<!--                />-->
<!--              </div>-->
<!--              <q-separator class="q-my-md" />-->
<!--              <div class="q-mb-md row justify-end">-->
<!--                <q-btn-->
<!--                  color="primary"-->
<!--                  text-color="white"-->
<!--                  :disable="!isWorksheetsReady"-->
<!--                  @click="onSave"-->
<!--                  >Create datasets</q-btn-->
<!--                >-->
<!--              </div>-->
<!--            </div>-->
<!--          </div>-->
<!--        </div>-->
<!--      </div>-->
<!--    </q-page>-->
<!--  </div>-->
<!--</template>-->

<!--<script lang="ts">-->
<!--import Vue from 'vue';-->
<!--import Component from 'vue-class-component';-->
<!--import { Getter, Action } from 'vuex-class';-->
<!--import {-->
<!--  EnumStoreDatasetUploadGetters as getters,-->
<!--  EnumStoreDatasetUploadActions as actions,-->
<!--  StoreDatasetUploadModel,-->
<!--  onSaveActionResponse-->
<!--} from './store';-->
<!--import * as IM from '@/infrastructure/core/IndexedMap';-->
<!--import { Watch } from 'vue-property-decorator';-->
<!--import { GoogleSpreadsheet } from 'google-spreadsheet';-->
<!--import SourceUploadedDisplayComponent from './components/SourceUploadedDisplay.component.vue';-->
<!--import SourceUploadedWorksheetDisplayComponent from './components/SourceUploadedWorksheetDisplay.component.vue';-->
<!--import {-->
<!--  SourceGoogleScheetColScheme,-->
<!--  SourceGoogleSheetScheme,-->
<!--  SourceGoogleSheetWorksheetScheme-->
<!--} from '@/infrastructure/source/google';-->
<!--import { sourceGoogleSheetWorksheetSchemeValidator } from '@/infrastructure/source/google/validators';-->

<!--const STATE_PATH = 'dataset/upload';-->

<!--@Component({-->
<!--  components: {-->
<!--    SourceUploadedDisplayComponent,-->
<!--    SourceUploadedWorksheetDisplayComponent-->
<!--  }-->
<!--})-->
<!--export default class DatasetUploadView extends Vue {-->
<!--  @Getter(`${STATE_PATH}/${getters.model}`)-->
<!--  _model!: StoreDatasetUploadModel;-->

<!--  @Getter(`${STATE_PATH}/${getters.scheme}`)-->
<!--  scheme!: SourceGoogleSheetScheme;-->

<!--  @Getter(`${STATE_PATH}/${getters.uploaded}`)-->
<!--  uploaded!: GoogleSpreadsheet | null;-->

<!--  @Getter(`${STATE_PATH}/${getters.selectedWorksheetsIndexes}`)-->
<!--  _selectedWorksheetIndexes!: number[];-->

<!--  @Getter(`${STATE_PATH}/${getters.isLoading}`)-->
<!--  isLoading!: boolean;-->

<!--  @Action(`${STATE_PATH}/${actions.updateModel}`)-->
<!--  _updateModel!: (model: StoreDatasetUploadModel) => void;-->

<!--  @Action(`${STATE_PATH}/${actions.upload}`)-->
<!--  _upload!: () => Promise<void>;-->

<!--  @Action(`${STATE_PATH}/${actions.updateScheme}`)-->
<!--  _actionUpdateColumn!: (payload: {-->
<!--    worksheetIndex: number;-->
<!--    col: SourceGoogleScheetColScheme;-->
<!--  }) => void;-->

<!--  @Action(`${STATE_PATH}/${actions.updateWorksheetMetadata}`)-->
<!--  _actionUpdateWorksheetMetadata!: (payload: {-->
<!--    scheme: Partial<SourceGoogleSheetWorksheetScheme>;-->
<!--    worksheetIndex: number;-->
<!--  }) => void;-->

<!--  @Action(`${STATE_PATH}/${actions.reset}`)-->
<!--  _reset!: () => void;-->

<!--  @Action(`${STATE_PATH}/${actions.updateSelectedWorksheets}`)-->
<!--  _updateSelectedWorksheets!: (payload: {-->
<!--    selectedWorksheetsIndexes: number[];-->
<!--  }) => void;-->

<!--  @Action(`${STATE_PATH}/${actions.save}`)-->
<!--  _save!: () => onSaveActionResponse;-->

<!--  get schemeWorksheetsAsList(): (-->
<!--    | number-->
<!--    | SourceGoogleSheetWorksheetScheme-->
<!--  )[][] {-->
<!--    if (!this.scheme) return [];-->
<!--    return IM.getEntities(this.scheme.sheets).map(x => [x.key, x.value]);-->
<!--  }-->

<!--  get isWorksheetsReady(): boolean {-->
<!--    return !IM.getValues(this.scheme.sheets)-->
<!--      .map(sourceGoogleSheetWorksheetSchemeValidator)-->
<!--      .some(x => x._tag == 'Left');-->
<!--  }-->

<!--  model: StoreDatasetUploadModel = { id: '' };-->

<!--  @Watch('_model')-->
<!--  _watchModel(state: StoreDatasetUploadModel) {-->
<!--    this.model = { ...state };-->
<!--  }-->

<!--  mounted() {-->
<!--    this._reset();-->
<!--  }-->

<!--  onUploadedWorksheetSelectedChanged(selectedIndexes: number[]) {-->
<!--    this._updateSelectedWorksheets({-->
<!--      selectedWorksheetsIndexes: selectedIndexes-->
<!--    });-->
<!--  }-->

<!--  onSchemeColUpdate(worksheetIndex: number, col: SourceGoogleScheetColScheme) {-->
<!--    this._actionUpdateColumn({-->
<!--      worksheetIndex: worksheetIndex,-->
<!--      col: col-->
<!--    });-->
<!--  }-->

<!--  onWorksheetMetadataUpdate(-->
<!--    worksheetIndex: number,-->
<!--    scheme: Partial<SourceGoogleSheetWorksheetScheme>-->
<!--  ) {-->
<!--    this._actionUpdateWorksheetMetadata({-->
<!--      worksheetIndex: worksheetIndex,-->
<!--      scheme: scheme-->
<!--    });-->
<!--  }-->

<!--  onSave() {-->
<!--    this._save();-->
<!--    this.$router.push({ name: 'dataset' });-->
<!--  }-->

<!--  uploadSheet() {-->
<!--    if (!this.model || !this.model.id || !this.model.id.length) {-->
<!--      return;-->
<!--    }-->

<!--    this._updateModel(this.model);-->
<!--    this._upload();-->
<!--  }-->
<!--}-->
<!--</script>-->