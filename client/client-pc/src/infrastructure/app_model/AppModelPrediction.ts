/**
 * @packageDocumentation AppModel
 */

import moment from 'moment';
import { generageId } from '../core';

/**
 * App prediction metadata.
 * Short information about AppModel prediction.
 * 
 * @interface
 */
export interface AppModelPredictionMetadata {
  /** Unique prediction id */
  id: string;

  /** App model id */
  modelId: string;

  /** Dataset used in prediction id */
  datasetId: string;

  /** Dataset used in prediction name */
  datasetName: string;

  /** AppModel name */
  modelName: string;

  /** Created time in unix */
  createdTime: number;

  /** Started time in unix */
  startedTime?: number;

  /** Finished time in unix */
  finishedTime?: number;

  /** Is prediction *validation* type */
  isValidation: boolean;
}

/**
 * App model prediction results.
 * Contains serializable prediction result information.
 * 
 * @interface
 */
export interface AppModelPredictionResult extends AppModelPredictionMetadata {
  /** Input labels */
  inputLabels: string[];

  /** Output labels (can be empty) */
  outputLabels: string[];

  /** Input data 2D array */
  inputData: number[][];

  /** Output data 2D array */
  outputData: number[][];

  /** Correct data 2D array (only for validation) */
  correctData: number[][];
}

/**
 * Create app model prediction metadata
 * 
 * @function
 */
export const createAppModelPredictionMetadata = (payload: { modelId: string; modelName: string; datasetId: string; datasetName: string; isValidation: boolean }): AppModelPredictionMetadata => ({
  createdTime: moment().unix(),
  datasetId: payload.datasetId,
  datasetName: payload.datasetName,
  modelId: payload.modelId,
  modelName: payload.modelName,
  id: generageId(8),
  isValidation: payload.isValidation
});