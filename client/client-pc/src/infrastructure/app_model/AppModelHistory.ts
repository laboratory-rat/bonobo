/**
 * @packageDocumentation AppModel
 */

import * as TF from '@tensorflow/tfjs-node';
import moment from 'moment';

export interface AppModelHistory {
  startedTime: number;
  finishedTime?: number;
  epoch: number[];
  losses: AppModelHistoryLosses;
}

export interface AppModelHistoryLosses {
  [label: string]: number[];
}

export const createAppModelHistoryFromTFHistory = (history: TF.History): AppModelHistory => {
  const losses = {} as AppModelHistoryLosses;
  ['loss', 'val_loss', 'mse', 'val_mse'].forEach((_label) => {
    if (history.history[_label] as (number | TF.Tensor<TF.Rank>)[]) {
      const _h = history.history[_label];
      let _data = [];
      if (_h as TF.Tensor<TF.Rank>[]) {
        _data = [..._h.map(x => (x as TF.Tensor<TF.Rank>).dataSync()[0])];
      } else {
        _data = [...(_h as number[])];
      }
      losses[_label] = _data;
    }
  });

  return {
    startedTime: moment().unix(),
    epoch: history.epoch,
    losses
  };
};