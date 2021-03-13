<template>
  <div>
    <q-card>

    <q-toolbar>
      <q-toolbar-title>
        <slot name="title">Title</slot>
      </q-toolbar-title>
      <q-space />
      <div>
        <slot name="actions" />
      </div>
    </q-toolbar>
    <q-separator class="q-my-md" />
    <div class='chart' v-if="chartOptions && chartSeries">
      <apexcharts height='100%' type="line" :options="chartOptions" :series="chartSeries" />
    </div>
    </q-card>

  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Prop, PropSync, Watch } from 'vue-property-decorator';
import { AppModelPredictionResult } from '@/infrastructure/app_model';
import Apexcharts from 'vue-apexcharts';
import Component from 'vue-class-component';

@Component({
  components: {
    Apexcharts
  }
})
export default class ValidationDisplayChartComponent extends Vue {
  @PropSync('result', { required: true })
  resultSync: AppModelPredictionResult | undefined = undefined;

  chartOptions?: {
    chart: { id: string };
    xaxis: { categories: string[] };
    yaxis: {min: number};
  } | null = null;
  chartSeries: unknown[] = [];

  @Watch('resultSync')
  _watchOnResult() {
    this.refreshChartData();
  }

  refreshChartData() {
    if (!this.resultSync) {
      return;
    }

    this.chartOptions = {
      chart: {
        id: 'chart'
      },
      xaxis: {
        categories: this.resultSync.outputData.map((_, i) => (i + 1).toString()),
      },
      yaxis: {
        min: 0
      }
    };

    this.chartSeries = [
      {
        name: this.resultSync.outputLabels[0] + ' (response)',
        data: this.resultSync.outputData.map(x => x[0])
      },
      {
        name: this.resultSync.outputLabels[0] + ' (correct)',
        data: this.resultSync.correctData.map(x => x[0])
      }
    ];
  }

  mounted() {
    this._watchOnResult();
    console.log(this.resultSync);
  }
}
</script>

<style scoped lang='scss'>
.chart {
  height: 60vh;
}
</style>
