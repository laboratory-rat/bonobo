import {Entity, model, property} from '@loopback/repository';

@model()
export class Dataset extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  type: string;

  @property({
    type: 'number',
    required: true,
  })
  size: number;

  @property({
    type: 'string',
    required: true,
  })
  sourceDS: string;

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

  constructor(data?: Partial<Dataset>) {
    super(data);
  }
}

export interface DatasetRelations {
  // describe navigational properties here
}

export type DatasetWithRelations = Dataset & DatasetRelations;
