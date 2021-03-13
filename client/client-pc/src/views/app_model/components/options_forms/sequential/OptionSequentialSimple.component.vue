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
          @input='onUpdate'
        />
      </div>
      <div class="col-6">
        <q-input
          dense
          filled
          v-model.number="options.batchSize"
          type="number"
          label="Batch size"
          @input='onUpdate'
        >
          <template v-slot:append v-if="!!options.batchSize">
            <q-icon
              class="cursor-pointer"
              name="close"
              @click.stop="clearBatchSize"
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
          @input='onUpdate'
        />
      </div>
      <div class="col-6">
        <q-checkbox
          label="Normalize dataset"
          v-model="options.normalizeDataset"
          @input='onUpdate'
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
          @input='onUpdate'
        />
      </div>
      <div class="col-6">
        <q-checkbox label="Shuffle dataset" @input='onUpdate' v-model="options.shuffleDataset" />
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
                debounce='300'
                @input='onUpdate'
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
                @input='onUpdate'
              />
            </td>
            <td>
              <q-checkbox v-model="layer.useBias" @input='onUpdate' dense />
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
            @input='onUpdate'
          />
        </div>
        <div class="col-6">
          <q-checkbox
            label="Use output bias"
            v-model="options.output.useBias"
            @input='onUpdate'
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Model, Emit, Watch } from 'vue-property-decorator';
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

  @Emit('on:update')
  onUpdate() {
    return this.options;
  }

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
    this.onUpdate();
  }

  clickDeleteLayer(layerIndex: number) {
    this.options.layers.splice(layerIndex, 1);
    this.onUpdate();
  }

  clearBatchSize() {
    this.options.batchSize = null;
    this.onUpdate();
  }
}
</script>
