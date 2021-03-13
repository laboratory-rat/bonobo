import AppModelViewComponent from './view.vue';
import AppModelListViewComponent from './children/list/view.vue';
import AppModelTrainingViewComponent from './children/training/view.vue';
import AppModelPredictionViewComponent from './children/prediction/view.vue';
import { route as routePrediction } from './children/prediction/route';

export const route = [
  {
    path: '/model',
    component: AppModelViewComponent,
    children: [
      {
        name: 'model',
        path: '/list',
        component: AppModelListViewComponent
      },
      {
        name: 'model-training',
        path: '/training/:id',
        component: AppModelTrainingViewComponent
      },
      {
        name: 'model-prediction',
        path: '/prediction',
        component: AppModelPredictionViewComponent,
        children: routePrediction
      }
    ]
  }
];
