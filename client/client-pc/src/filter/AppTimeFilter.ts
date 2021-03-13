import moment from 'moment';
import Vue from 'vue';

export const appTimeFilter = (value: number): string =>
  moment.unix(value).local().format('DD.MM.YYYY hh:mm');

Vue.filter('appTime', appTimeFilter);
