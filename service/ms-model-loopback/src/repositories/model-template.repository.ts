import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasOneRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ModelTemplate, ModelTemplateRelations, ModelTrainResult} from '../models';
import {ModelTrainResultRepository} from './model-train-result.repository';

export class ModelTemplateRepository extends DefaultCrudRepository<
  ModelTemplate,
  typeof ModelTemplate.prototype.id,
  ModelTemplateRelations
> {

  public readonly modelTrainResult: HasOneRepositoryFactory<ModelTrainResult, typeof ModelTemplate.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ModelTrainResultRepository') protected modelTrainResultRepositoryGetter: Getter<ModelTrainResultRepository>,
  ) {
    super(ModelTemplate, dataSource);
    this.modelTrainResult = this.createHasOneRepositoryFactoryFor('modelTrainResult', modelTrainResultRepositoryGetter);
    this.registerInclusionResolver('modelTrainResult', this.modelTrainResult.inclusionResolver);
  }
}
