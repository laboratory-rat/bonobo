import {Model, model, property} from '@loopback/repository';

@model()
export class DatasetGoogleRequest extends Model {
  @property({
    type: 'string',
    required: true,
  })
  url: string;


  constructor(data?: Partial<DatasetGoogleRequest>) {
    super(data);
  }
}

export interface DatasetGoogleRequestRelations {
  // describe navigational properties here
}

export type DatasetGoogleRequestWithRelations = DatasetGoogleRequest & DatasetGoogleRequestRelations;
