package repointerface

import (
	entity "bonobo.madrat.studio/ms/domain/entity/dataset"
)

type IDatasetDataRepository interface {
	Create(entity *entity.DatasetDataEntity) (*entity.DatasetDataEntity, error)
	Read(string) (*entity.DatasetDataEntity, error)
	Update(entity *entity.DatasetDataEntity) (*entity.DatasetDataEntity, error)
	Delete(id string) error
}
