import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  ModelTemplate,
  ModelTrainResult,
} from '../models';
import {ModelTemplateRepository} from '../repositories';

export class ModelTemplateModelTrainResultController {
  constructor(
    @repository(ModelTemplateRepository) protected modelTemplateRepository: ModelTemplateRepository,
  ) { }

  @get('/model-templates/{id}/model-train-result', {
    responses: {
      '200': {
        description: 'ModelTemplate has one ModelTrainResult',
        content: {
          'application/json': {
            schema: getModelSchemaRef(ModelTrainResult),
          },
        },
      },
    },
  })
  async get(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<ModelTrainResult>,
  ): Promise<ModelTrainResult> {
    return this.modelTemplateRepository.modelTrainResult(id).get(filter);
  }

  @post('/model-templates/{id}/model-train-result', {
    responses: {
      '200': {
        description: 'ModelTemplate model instance',
        content: {'application/json': {schema: getModelSchemaRef(ModelTrainResult)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof ModelTemplate.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelTrainResult, {
            title: 'NewModelTrainResultInModelTemplate',
            exclude: ['id'],
            optional: ['modelTemplateId']
          }),
        },
      },
    }) modelTrainResult: Omit<ModelTrainResult, 'id'>,
  ): Promise<ModelTrainResult> {
    return this.modelTemplateRepository.modelTrainResult(id).create(modelTrainResult);
  }

  @patch('/model-templates/{id}/model-train-result', {
    responses: {
      '200': {
        description: 'ModelTemplate.ModelTrainResult PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ModelTrainResult, {partial: true}),
        },
      },
    })
    modelTrainResult: Partial<ModelTrainResult>,
    @param.query.object('where', getWhereSchemaFor(ModelTrainResult)) where?: Where<ModelTrainResult>,
  ): Promise<Count> {
    return this.modelTemplateRepository.modelTrainResult(id).patch(modelTrainResult, where);
  }

  @del('/model-templates/{id}/model-train-result', {
    responses: {
      '200': {
        description: 'ModelTemplate.ModelTrainResult DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(ModelTrainResult)) where?: Where<ModelTrainResult>,
  ): Promise<Count> {
    return this.modelTemplateRepository.modelTrainResult(id).delete(where);
  }
}
