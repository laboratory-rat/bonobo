import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Dataset, DatasetRelations} from '../models';

export class DatasetRepository extends DefaultCrudRepository<
  Dataset,
  typeof Dataset.prototype.id,
  DatasetRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Dataset, dataSource);
  }
}
