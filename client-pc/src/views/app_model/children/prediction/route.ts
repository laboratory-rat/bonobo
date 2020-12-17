import AppModelPredictionView from './view.vue';
import AppModelPredictionListView from './children/list/view.vue';
import AppModelPredictionExploreView from './children/explore/view.vue';

export const route = [
  {
    path: '/prediction',
    component: AppModelPredictionView,
    redirect: '/:id/list',
    children: [
      {
        name: 'model-prediction-list',
        path: '/list',
        component: AppModelPredictionListView
      },
      {
        name: 'model-prediction-explore',
        path: '/explore/:predictionId',
        component: AppModelPredictionExploreView
      }
    ]
  }
];