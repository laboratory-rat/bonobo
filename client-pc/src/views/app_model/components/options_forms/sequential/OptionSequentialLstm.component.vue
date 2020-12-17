<template>
  <div>
    <div class="row wrap q-col-gutter-md">
      <div class="col-6">
        <q-input
          dense
          filled
          v-model.number="options.learningRate"
          type="number"
          label="Learning rate"
        ></q-input>
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
      <div class="col-12">
        <div class="q-pr-sm w-100 text-right text-subtitle1">
          Layers
        </div>
        <q-markup-table dense separator="vertical" flat bordered>
          <thead>
            <tr>
              <th class="text-left">Units</th>
              <th class="text-left">Activation</th>
              <th class="text-left">Use bias</th>
              <th>
                <q-btn padding="sm" flat @click="clickAddLayer()" icon="add" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(layer, $index) in options.layers"
              :key="'lstm-layer-' + $index"
            >
              <td>
                <div>
                  <q-chip
                    square
                    v-for="(unit, $unitIndex) in layer.units"
                    :key="'layer-' + $index + '-unit-' + $unitIndex"
                  >
                    <span class="cursor-pointer">{{ unit }}</span>
                    <q-popup-edit :value="unit">
                      <q-input
                        :value="unit"
                        type="number"
                        @input="onLayerUnitChange($index, $unitIndex, $event)"
                        dense
                        autofocus
                      />
                    </q-popup-edit>
                    <q-icon
                      name="close"
                      color="red"
                      class="q-ml-md cursor-pointer"
                      @click.stop="clickDeletLayerUnits($index, $unitIndex)"
                    />
                  </q-chip>
                  <q-chip
                    clickable
                    @click="clickAddLayerUnit($index, 50)"
                    square
                    icon="add"
                    label="Add"
                  />
                </div>
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
                <div>
                  <q-checkbox v-model="layer.useBias" />
                </div>
              </td>
              <td class="text-right" style="width: 64px">
                <q-btn
                  icon="close"
                  @click="clickDeleteLayer($index)"
                  text-color="red"
                  round
                  flat
                ></q-btn>
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </div>
      <div class="col-12 text-subtitle1 w-100 text-right">Output</div>
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
        <q-checkbox label="Use output bias" v-model="options.output.useBias" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  AppModelOptionsSequentialLSTM,
  defaultAppModelOptionsSequentialLSTMLayer
} from '@/infrastructure/app_model/options/sequential/lstm';
import Vue from 'vue';
import { Component, Model } from 'vue-property-decorator';
import * as Activation from '@/infrastructure/app_model/activation';
import { KeyLabelStringIterable } from '@/infrastructure/core';

@Component
export default class OptionSequentialLstm extends Vue {
  @Model()
  options!: AppModelOptionsSequentialLSTM;

  get appActivationTypesList(): KeyLabelStringIterable<
    Activation.AppActivationType
  >[] {
    return Activation.appActivationTypesList;
  }

  clickAddLayer() {
    this.options.layers.push(defaultAppModelOptionsSequentialLSTMLayer());
  }

  clickDeleteLayer(index: number) {
    this.options.layers.splice(index, 1);
  }

  clickAddLayerUnit(layerIndex: number, unitsCount: number) {
    this.options.layers[layerIndex].units.push(unitsCount);
  }

  clickDeletLayerUnits(layerIndex: number, unitsIndex: number) {
    this.options.layers[layerIndex].units.splice(unitsIndex, 1);
  }

  onLayerUnitChange(layerIndex: number, unitIndex: number, value: unknown) {
    this.options.layers[layerIndex].units[unitIndex] =
      Number(Number(value).toFixed()) || 50;
    this.options.layers = this.options.layers.map(x => ({ ...x }));
  }
}
</script>
