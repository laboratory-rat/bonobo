/**
 * @packageDocumentation AppModel
 */

import moment from 'moment';
import { AppError, generageId } from '../core';
import { AppDatasetMetadata } from '../dataset';
import { EnumAppModelSubtype, EnumAppModelType } from './enum';
import * as E from 'fp-ts/Either';
import * as F from 'fp-ts/function';
import { AppModelError, createAppModelValiadtionError } from './error';
import { AppModelOptions, validateAppModelOptions } from './options/AppModelOptions';

const _idLength = 8;

export interface AppModel {
  id: string;
  name: string;
  trainingSplit: number;
  trainingEpochsLimit: number;
  errorThreshold?: number;
  type: EnumAppModelType;
  subtype: EnumAppModelSubtype;
  options: AppModelOptions;
  datasetId: string;
  inputsCount: number;
  outputsCount: number;
  createdTime: number;
  updatedTime: number;
  finalResult?: AppModelFinalLoss;
  trained: boolean;
}

export interface AppModelFinalLoss {
  [label: string]: number[];
}

export const createAppModelFromDatasetMetadata = (metadata: AppDatasetMetadata, payload: { name: string; type: EnumAppModelType; subtype: EnumAppModelSubtype; options: AppModelOptions; trainingSplit: number; trainingEpochsLimit: number }): AppModel => ({
  id: generageId(_idLength),
  createdTime: moment().unix(),
  updatedTime: moment().unix(),
  datasetId: metadata.id,
  inputsCount: metadata.header.filter(x => !x.isOutput).length,
  outputsCount: metadata.header.filter(x => x.isOutput).length,
  finalResult: {},
  trained: false,
  ...payload
});

export const validateAppModel = (model: AppModel): E.Either<AppError, unknown> => {
  // const lift = <E, A>(check: (a: A) => E.Either<E, A>): (a: A) => E.Either<NonEmptyArray<E>, A> =>
  //   a =>
  //     F.pipe(
  //       check(a),
  //       E.mapLeft(a => [a])
  //     );

  const vName =
    (m: AppModel): E.Either<AppModelError, AppModel> => !m.name || !m.name.length ? E.left(createAppModelValiadtionError('Name is required')) : E.right(m);

  const vDataset =
    (m: AppModel): E.Either<AppModelError, AppModel> => !m.datasetId || !m.datasetId.trim().length ? E.left(createAppModelValiadtionError('Dataset id is required')) : E.right(m);

  const vType =
    (m: AppModel): E.Either<AppModelError, AppModel> => !m.type ? E.left(createAppModelValiadtionError('Type is required')) : E.right(m);

  const vSubtype =
    (m: AppModel): E.Either<AppModelError, AppModel> => !m.subtype ? E.left(createAppModelValiadtionError('Subtype is required')) : E.right(m);

  const vInput =
    (m: AppModel): E.Either<AppModelError, AppModel> => !m.inputsCount || m.inputsCount < 1 ? E.left(createAppModelValiadtionError('Inputs count must be > 1')) : E.right(m);

  const vOutput =
    (m: AppModel): E.Either<AppModelError, AppModel> => !m.outputsCount || m.outputsCount < 1 ? E.left(createAppModelValiadtionError('Outputs count must be > 0')) : E.right(m);

  const vTrainSplit =
    (m: AppModel): E.Either<AppModelError, AppModel> => !m.trainingSplit || m.trainingSplit > 1 || m.trainingSplit < 0 ? E.left(createAppModelValiadtionError('Train split must be >= 0 && <= 1')) : E.right(m);

  const vTrainingEpochsLimit =
    (m: AppModel): E.Either<AppModelError, AppModel> => !m.trainingEpochsLimit || m.trainingEpochsLimit > 1000000 || m.trainingEpochsLimit < 1 ? E.left(createAppModelValiadtionError('Training epochs limit must be >= 1 && < 1 000 000')) : E.right(m);

  const vOptions =
    (m: AppModel): E.Either<AppModelError, AppModel> => {
      if (!m.options) return E.left(createAppModelValiadtionError('Options is required'));
      return E.fold(
        () => E.left(createAppModelValiadtionError('Options are invalid')),
        () => E.right(m)
      )(validateAppModelOptions(m.options));
    };

  return F.pipe(
    model,
    E.fromNullable(createAppModelValiadtionError('Model is null')),
    E.chain(vName),
    E.chain(vDataset),
    E.chain(vType),
    E.chain(vSubtype),
    E.chain(vInput),
    E.chain(vOutput),
    E.chain(vTrainSplit),
    E.chain(vTrainingEpochsLimit),
    E.chain(vOptions),
  );
};
