<template>
  <div>
    <q-page padding>
      <div class="row justify-center">
        <div class="col-10">
          <q-card v-if="model">
            <q-card-section>
              <q-input
                clearable
                dense
                :disable="isLoading"
                clear-icon="close"
                outlined
                v-model="model.id"
                debounce="50"
                label="Sheet id"
              >
                <template v-slot:after>
                  <q-btn
                    round
                    dense
                    flat
                    :disable="!model.id || !model.id.length || isLoading"
                    icon="cloud_download"
                    :loading="isLoading"
                    @click="upload"
                  />
                </template>
              </q-input>
            </q-card-section>
          </q-card>
          <div class="q-mt-md" v-if="processed && processed.length">
            <q-card>
              <scheme-selector-component
                :metadata-list="processed"
                :selected-metadata-list="selectedMetadataList"
                @selected:update="toggleScheme"
              />
            </q-card>
          </div>
          <div v-if='selectedMetadataList && selectedMetadataList.length'>
            <q-card class='q-mt-md' v-for='id in selectedMetadataList' :key='id'>
              <scheme-update-component
                :approve-model='selectedMetadataMap.get(id)'
                :examples='[]'
                :data='getMetadataByID(id)'
                :saved='approvedMetadataList.indexOf(id) !== -1'
                @model:update='(m) => updateScheme({worksheetID: id, model: m})'
                @model:approve='approveScheme'
                />
            </q-card>
          </div>
        </div>
      </div>
    </q-page>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { namespace } from 'vuex-class';
import {
  EnumStoreDatasetUploadGetters as getters,
  EnumStoreDatasetUploadActions as actions,
  StoreDatasetUploadModel,
  AppDatasetApproveSelected
} from './store';
import { Watch } from 'vue-property-decorator';
import { AppDatasetApprove, AppDatasetMetadata } from '@/infrastructure/dataset';
import SchemeUpdateComponent from '@/views/dataset/children/upload/components/SchemeUpdate.component.vue';
import SchemeSelectorComponent from '@/views/dataset/children/upload/components/SchemeSelector.component.vue';

const store = namespace('dataset/upload');

@Component({
  components: {
    SchemeUpdateComponent,
    SchemeSelectorComponent
  }
})
export default class DatasetUploadView extends Vue {
  @store.Getter(getters.model)
  _model!: StoreDatasetUploadModel;

  @store.Getter(getters.isLoading)
  isLoading!: boolean;

  @store.Getter(getters.processed)
  processed!: AppDatasetMetadata[];

  @store.Getter(getters.approvedMetadataList)
  approvedMetadataList!: string[];

  @store.Getter(getters.selectedMetadataList)
  selectedMetadataList!: string[];

  @store.Getter(getters.selectedMetadataMap)
  selectedMetadataMap!: Map<string, AppDatasetApproveSelected>;

  model: StoreDatasetUploadModel | null = null;

  @Watch('_model')
  watchOnModel(m: StoreDatasetUploadModel) {
    this.model = {
      ...m
    };
  }

  @store.Action(actions.updateModel)
  _updateModel!: any;

  @store.Action(actions.upload)
  upload!: any;

  @store.Action(actions.toggleScheme)
  toggleScheme!: (id: string) => unknown;

  @store.Action(actions.updateScheme)
  updateScheme!: (payload: { worksheetID: string; model: AppDatasetApprove }) => unknown;

  @store.Action(actions.approveScheme)
  approveScheme!: (modelID: string) => unknown;

  updateModel() {
    this._updateModel(this.model);
  }

  getMetadataByID(id: string): AppDatasetMetadata | undefined {
    return this.processed.find(x => x.id == id);
  }

  getExamplesByID(id: string): unknown {
    return null;
  }

  mounted() {
    this.model = {
      ...this._model
    };
  }
}
</script>
