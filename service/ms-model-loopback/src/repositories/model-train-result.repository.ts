import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ModelTrainResult, ModelTrainResultRelations} from '../models';

export class ModelTrainResultRepository extends DefaultCrudRepository<
  ModelTrainResult,
  typeof ModelTrainResult.prototype.id,
  ModelTrainResultRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(ModelTrainResult, dataSource);
  }
}
