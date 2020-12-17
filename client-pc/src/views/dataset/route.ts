import DatasetViewComponent from './view.vue';
import DatasetListComponent from './children/list/view.vue';
import DatasetUploadComponent from './children/upload/view.vue';

export const route = [
  {
    path: '/dataset',
    component: DatasetViewComponent,
    children: [
      {
        name: 'dataset',
        path: '',
        component: DatasetListComponent
      },
      {
        name: 'dataset-upload',
        path: '/upload',
        component: DatasetUploadComponent
      }
    ]
  }
];
