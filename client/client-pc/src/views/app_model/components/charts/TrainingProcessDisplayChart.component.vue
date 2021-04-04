<template>
  <div>
    <q-toolbar>
      <q-toolbar-title>
        <slot name="title">Title</slot>
      </q-toolbar-title>
      <q-space />
      <div>
        <slot name="actions"></slot>
        <q-select
          :options="lossSensitiveOptions"
          v-model="selectedLossSensitive"
          option-label="label"
          label="Chart sensitive"
          dense
          style="min-width: 200px"
        />
      </div>
    </q-toolbar>
    <q-separator class="q-my-sm" />
    <div class='chart'>
      <apexcharts
        v-if="!!syncHistory"
        type="line"
        height='100%'
        :options="trainChartOptions"
        :series="trainChartSeries"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, PropSync } from 'vue-property-decorator';
import * as AM from '@/infrastructure/app_model';
import Apexcharts from 'vue-apexcharts';

interface LossSensitiveOption {
  key: string;
  func: (loss: number) => number;
  label: string;
}

const _lossSensitive: LossSensitiveOption[] = [...Array(10).keys()].map(
  key => ({
    key: String(key),
    func: loss => loss * Math.pow(10, key),
    label: `10^(${key == 0 ? '0' : '-' + key})`
  })
);

@Component({
  components: {
    Apexcharts
  }
})
export default class TrainingProcessDisplayChartComponent extends Vue {
  @PropSync('history')
  syncHistory!: AM.AppModelHistory | null;

  get trainChartOptions() {
    return {
      chart: {
        id: 'train-chart'
      },
      xaxis: {
        categories: !this.syncHistory
          ? []
          : this.syncHistory.epoch.map(x => x + 1)
      },
      yaxis: {
        min: 0,
      }
    };
  }

  get trainChartSeries() {
    const series: unknown[] = [];
    if (!this.syncHistory) {
      return series;
    }

    for (const key in this.syncHistory.losses) {
      const value = this.syncHistory.losses[key];
      series.push({
        name:
          key +
          (this.selectedLossSensitive.key == '0'
            ? ''
            : ` 10^(-${this.selectedLossSensitive.key})`),
        data: value.map(this.selectedLossSensitive.func),
      });
    }

    return series;
  }

  lossSensitiveOptions: LossSensitiveOption[] = _lossSensitive;
  selectedLossSensitive: LossSensitiveOption = _lossSensitive[0];
}
</script>

<style scoped lang='scss'>
.chart {
  height: 60vh;
}
</style>