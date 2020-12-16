package repointerface

import (
	entity "bonobo.madrat.studio/ms/domain/entity/dataset"
	repomodel "bonobo.madrat.studio/ms/infrastructure/repository/model"
)

type IDatasetMetadataRepository interface {
	GetList(filter *repomodel.SearchFilter) (*[]entity.DatasetMetadataEntity, error)
	GetById(id string) (*entity.DatasetMetadataEntity, error)
	Create(e *entity.DatasetMetadataEntity) (*entity.DatasetMetadataEntity, error)
	Update(e *entity.DatasetMetadataEntity) (*entity.DatasetMetadataEntity, error)
	DeleteById(id string) error
}
