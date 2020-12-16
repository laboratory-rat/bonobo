/**
 * @packageDocumentation AppModel
 */

import * as TF from '@tensorflow/tfjs-node';
import moment from 'moment';

export interface AppModelHistory {
  startedTime: number;
  finishedTime?: number;
  epoch: number[];
  loss: number[];
  valLoss?: number[];
}

export const createAppModelHistoryFromTFHistory = (history: TF.History): AppModelHistory => ({
  startedTime: moment().unix(),
  epoch: history.epoch,
  loss: history.history['loss'] as number[],
  valLoss: history.history['val_loss'] ? history.history['val_loss'] as number[] : undefined,
});