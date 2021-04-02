import {Entity, model, property} from '@loopback/repository';

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


  constructor(data?: Partial<ModelTrainResult>) {
    super(data);
  }
}

export interface ModelTrainResultRelations {
  // describe navigational properties here
}

export type ModelTrainResultWithRelations = ModelTrainResult & ModelTrainResultRelations;
