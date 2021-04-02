import {Entity, model, property, hasOne} from '@loopback/repository';
import {ModelTrainResult, ModelTrainResultWithRelations} from './model-train-result.model';

@model()
export class ModelTemplate extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true
  })
  name: string;

  @property({
    type: 'number',
    required: true,
  })
  inputsCount: number;

  @property({
    type: 'number',
    required: true,
  })
  outputsCount: number;

  @property({
    type: 'string',
    required: true,
  })
  sourceTF: string;

  @property({
    type: 'string',
    required: true,
  })
  sourceBN: string;

  @property({
    type: 'number',
    required: true,
  })
  createdTime: number;

  @property({
    type: 'number',
    required: true,
  })
  updatedTime: number;

  @hasOne(() => ModelTrainResult)
  modelTrainResult: ModelTrainResult;

  constructor(data?: Partial<ModelTemplate>) {
    super(data);
  }
}

export interface ModelTemplateRelations {
  modelTrainResult?: ModelTrainResultWithRelations
  // describe navigational properties here
}

export type ModelTemplateWithRelations = ModelTemplate & ModelTemplateRelations;
