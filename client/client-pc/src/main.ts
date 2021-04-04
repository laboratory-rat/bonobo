import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './quasar';
import '@/filter/AppTimeFilter';
import { getAppDI } from '@/di/AppDI';

Vue.config.productionTip = false;

getAppDI({
  // config: (process.env.DI_CONFIG as string) ?? './prod.yaml',
  config: './prod.yaml',
  force: true
});

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');
