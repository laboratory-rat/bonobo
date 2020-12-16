import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import { route as startupRoute } from '@/views/startup/route';
import { route as datasetRoute } from '@/views/dataset/route';
import { route as appModelRoute } from '@/views/app_model/route';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  ...startupRoute,
  ...datasetRoute,
  ...appModelRoute,
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router;
