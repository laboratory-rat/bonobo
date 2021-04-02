import {Entity, model, property} from '@loopback/repository';
import {ModelTemplateWithRelations} from './model-template.model';

@model()
export class ModelTrainResult extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

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

  @property({
    type: 'number',
  })
  modelTemplateId?: number;

  constructor(data?: Partial<ModelTrainResult>) {
    super(data);
  }
}

export interface ModelTrainResultRelations {
  modelTemplate?: ModelTemplateWithRelations
  // describe navigational properties here
}

export type ModelTrainResultWithRelations = ModelTrainResult & ModelTrainResultRelations;
