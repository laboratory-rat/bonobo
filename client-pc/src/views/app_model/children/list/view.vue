<template>
  <div>
    <q-page padding>
      <div class="text-h5">
        Available models:
      </div>
      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col-6" v-for="(model, $index) in list" :key="model.id">
          <q-card class="cursor-pointer">
            <q-card-section>
              <div class="flex justify-between">
                <div>
                  <div class="text-subtitle1">{{ model.name }}</div>
                  <div class="text-caption">
                    <span v-if="model.trained">Trained</span>
                    <span v-else>Not trained</span>
                  </div>
                </div>
                <div>
                  <div class="text-subtitle2 text-grey">
                    {{ model.createdTime | appTime }}
                  </div>
                </div>
              </div>
            </q-card-section>
            <q-card-actions>
              <q-btn
                label="expand"
                flat
                @click.stop="onClickToggleExpandModel($index)"
              />
            </q-card-actions>
            <q-slide-transition>
              <div v-show="expandedModelsList.indexOf($index) !== -1">
                <q-separator />
                <q-card-section>
                  <code class="text-pre">
                    {{ model }}
                  </code>
                </q-card-section>
              </div>
            </q-slide-transition>
            <q-menu touch-position>
              <q-list style="min-width: 100px">
                <q-item
                  v-if="!model.trained"
                  clickable
                  v-close-popup
                  @click="onClickTrain(model)"
                >
                  <q-item-section>
                    <span>Train model</span>
                  </q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-close-popup
                  :to="{ name: 'model-prediction-list', params: { id: model.id } }"
                >
                  <q-item-section>
                    <span>Predict with model</span>
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup>
                  <q-item-section>View</q-item-section>
                </q-item>
                <q-separator />
                <q-item
                  @click="onClickDelete(model)"
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
    </q-page>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import {
  EnumStoreAppModelListGetters as getters,
  EnumStoreAppModelListActions as actions
} from './store';
import * as AM from '@/infrastructure/app_model';

const storeList = namespace('model/list');

@Component
export default class AppModelListView extends Vue {
  @storeList.Getter(getters.list)
  list!: AM.AppModel[];

  @storeList.Action(actions.refresh)
  _actionRefresh!: () => void;

  @storeList.Action(actions.deleteById)
  _actionDeleteById!: (payload: { id: string }) => void;

  expandedModelsList: number[] = [];

  mounted() {
    this._actionRefresh();
  }

  onClickTrain(model: AM.AppModel) {
    this.$router.push({
      name: 'model-training',
      params: {
        id: model.id
      }
    });
  }

  onClickDelete(model: AM.AppModel) {
    this.$q
      .dialog({
        parent: this,
        title: `Delete model ${model.name}?`,
        message: 'This action can not be reveted!',
        cancel: true,
        ok: 'DELETE',
        focus: 'cancel'
      })
      .onOk(() => this._actionDeleteById(model));
  }

  onClickToggleExpandModel($index: number) {
    const existsIndex = this.expandedModelsList.indexOf($index);
    if (existsIndex === -1) {
      this.expandedModelsList.push($index);
    } else {
      this.expandedModelsList.splice(existsIndex, 1);
    }
  }
}
</script>
