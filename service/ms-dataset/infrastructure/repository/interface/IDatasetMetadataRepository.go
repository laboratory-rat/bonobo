package repointerface

import (
	entity "bonobo.madrat.studio/ms/domain/entity/dataset"
	repomodel "bonobo.madrat.studio/ms/infrastructure/repository/model"
)

type IDatasetMetadataRepository interface {
	Create(e *entity.DatasetMetadataEntity) (*entity.DatasetMetadataEntity, error)
	GetList(filter *repomodel.SearchFilter) (*[]entity.DatasetMetadataEntity, error)
	GetByID(id string) (*entity.DatasetMetadataEntity, error)
	GetExpired() ([]*entity.DatasetMetadataEntity, error)
	Update(e *entity.DatasetMetadataEntity) (*entity.DatasetMetadataEntity, error)
	DeleteByID(ID string) error
}
