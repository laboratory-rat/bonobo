<template>
  <div>
    Explore
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import {
  EnumStoreGetters as getters,
  EnumStoreActions as actions
} from './store';
import * as AM from '@/infrastructure/app_model';

const store = namespace('model/prediction/explore');

@Component
export default class AppModelPredictionExploreView extends Vue {
  @store.Action(actions.init)
  _actionInit!: (payload: { modelId: string; predictionId: string }) => void;

  @store.Action(actions.process)
  _actionProcess!: () => void;

  @store.Getter(getters.model)
  model!: unknown;

  @store.Getter(getters.result)
  result!: AM.AppModelPredictionResult | null;

  mounted() {
    console.log(this.$route);
    this._actionInit({
      modelId: this.$route.params.id,
      predictionId: this.$route.params.predictionId
    });

    if (this.result == null) {
      this._actionProcess();
    }
  }
}
</script>
