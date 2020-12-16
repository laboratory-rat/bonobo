import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { storeDatasetModule as dataset } from '@/views/dataset/store';
import { storeAppModelModule as model } from '@/views/app_model/store'; 

Vue.use(Vuex);

export interface AppState {
  error: undefined;
}

const createDefaultState = (): AppState => ({
  error: undefined
});

export default new Store<AppState>({
  state: createDefaultState,
  mutations: {},
  actions: {},
  devtools: true,
  strict: true,
  modules: {
    dataset,
    model
  }
});
