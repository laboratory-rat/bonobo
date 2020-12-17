<template>
  <div>
    <div class="row wrap q-col-gutter-md">
      <div class="col-6">
        <q-input
          dense
          filled
          v-model.number="options.learningRate"
          type="number"
          label="Learning rate *"
        />
      </div>
      <div class="col-6">
        <q-input
          dense
          filled
          v-model.number="options.batchSize"
          type="number"
          label="Batch size"
        >
          <template v-slot:append v-if="!!options.batchSize">
            <q-icon
              class="cursor-pointer"
              name="close"
              @click.stop="options.batchSize = null"
            />
          </template>
        </q-input>
      </div>
      <div class="col-6">
        <q-select
          label="Loss function *"
          :options="appModelLoss"
          v-model="options.loss"
          option-label="label"
          option-value="key"
          dense
          filled
          map-options
          emit-value
        />
      </div>
      <div class="col-6">
        <q-checkbox
          label="Normalize dataset"
          v-model="options.normalizeDataset"
        />
      </div>
      <div class="col-6">
        <q-select
          label="Optimizer *"
          :options="appModelOptimizersOptions"
          v-model="options.optimizer"
          option-label="label"
          option-value="key"
          dense
          filled
          map-options
          emit-value
        />
      </div>
      <div class="col-6">
        <q-checkbox label="Shuffle dataset" v-model="options.shuffleDataset" />
      </div>
    </div>
    <div>
      <div class="q-my-md q-mr-md w-100 text-right text-subtitle1">
        Layers
      </div>
      <q-markup-table dense separator="vertical" flat bordered>
        <thead>
          <tr>
            <th class="text-left">Units</th>
            <th class="text-left">Activation</th>
            <th class="text-left">Use bias</th>
            <th class="text-left">
              <q-btn padding="sm" flat @click="clickAddLayer" icon="add" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(layer, $index) in options.layers"
            :key="'layer-' + $index"
          >
            <td>
              <q-input
                dense
                filled
                type="number"
                v-model.number="layer.units"
              />
            </td>
            <td>
              <q-select
                :options="appActivationTypesList"
                v-model="layer.activation"
                option-label="label"
                option-value="key"
                dense
                filled
                map-options
                emit-value
              />
            </td>
            <td>
              <q-checkbox v-model="layer.useBias" dense />
            </td>
            <td style="width: 64px;">
              <q-btn
                icon="close"
                text-color="red"
                flat
                round
                @click="clickDeleteLayer($index)"
              />
            </td>
          </tr>
        </tbody>
      </q-markup-table>
      <div class="text-subtitle1 w-100 text-right q-my-md q-mr-md">Output</div>
      <div class="row q-col-gutter-md">
        <div class="col-6">
          <q-select
            :options="appActivationTypesList"
            v-model="options.output.activation"
            option-label="label"
            option-value="key"
            dense
            filled
            map-options
            emit-value
            label="Activation"
          />
        </div>
        <div class="col-6">
          <q-checkbox
            label="Use output bias"
            v-model="options.output.useBias"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Model } from 'vue-property-decorator';
import * as MSS from '@/infrastructure/app_model/options/sequential/simple';
import * as Activation from '@/infrastructure/app_model/activation';
import { KeyLabelStringIterable } from '@/infrastructure/core';
import {
  AppModelLoss,
  appModelLossTypesList,
  AppModelOptimizer,
  AppModelOptimizersList
} from '@/infrastructure/app_model';

@Component
export default class OptionSequentialSimpleComponent extends Vue {
  @Model()
  options!: MSS.AppModelOptionsSequentialSimple;

  get appActivationTypesList(): KeyLabelStringIterable<
    Activation.AppActivationType
  >[] {
    return Activation.appActivationTypesList;
  }

  get appModelOptimizersOptions(): KeyLabelStringIterable<AppModelOptimizer>[] {
    return AppModelOptimizersList();
  }

  get appModelLoss(): KeyLabelStringIterable<AppModelLoss>[] {
    return appModelLossTypesList();
  }

  clickAddLayer() {
    this.options.layers.push(MSS.defaultAppModelOptionsSequentialSimpleLayer());
  }

  clickDeleteLayer(layerIndex: number) {
    this.options.layers.splice(layerIndex, 1);
  }
}
</script>
