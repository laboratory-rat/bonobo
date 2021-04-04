package repoinstance

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"time"

	"bonobo.madrat.studio/ms/connector"
	entity "bonobo.madrat.studio/ms/domain/entity/dataset"
	"bonobo.madrat.studio/ms/utility"
	"cloud.google.com/go/storage"
)

type DatasetDataRepository struct {
	ProjectId string
	Logger    *utility.Logger
	Bucket    *storage.BucketHandle
}

func getPath(id string) string {
	return fmt.Sprintf("dataset/%s", id)
}

func NewDatasetDataRepository(logger *utility.Logger, c *connector.AppFirebase) *DatasetDataRepository {
	return &DatasetDataRepository{
		ProjectId: c.Config.ProjectID,
		Logger:    logger,
		Bucket:    c.Bucket,
	}
}

func (r *DatasetDataRepository) Create(entity *entity.DatasetDataEntity) (*entity.DatasetDataEntity, error) {
	now := time.Now().Unix()
	entity.ID = utility.GenerateRandomId()
	entity.CreatedTime = now
	entity.UpdatedTime = now

	bucket := r.Bucket
	content, err := json.Marshal(entity)
	if err != nil {
		r.Logger.Panic(err)
		return nil, err
	}

	ctx := context.Background()
	ctx, cancel := context.WithTimeout(ctx, time.Second*50)
	defer cancel()

	wc := bucket.Object(getPath(entity.ID)).NewWriter(ctx)
	wc.ContentType = "application/json"
	wc.Metadata = map[string]string{
		"x-goog-meta-user-id":    entity.UserID,
		"x-goog-meta-project-id": r.ProjectId,
	}

	if _, err := wc.Write(content); err != nil {
		r.Logger.Panic(err)
		return nil, err
	}

	if err := wc.Close(); err != nil {
		r.Logger.Panic(err)
		return nil, err
	}

	return entity, nil
}

func (r *DatasetDataRepository) Read(id string) (*entity.DatasetDataEntity, error) {
	ctx := context.Background()
	bucket := r.Bucket

	ctx, cancel := context.WithTimeout(ctx, time.Second*50)
	defer cancel()

	rc, err := bucket.Object(getPath(id)).NewReader(ctx)
	if err != nil {
		r.Logger.Panic(err)
		return nil, err
	}

	defer rc.Close()

	data, err := ioutil.ReadAll(rc)
	if err != nil {
		r.Logger.Panic(err)
		return nil, err
	}

	var entity_ entity.DatasetDataEntity
	if err := json.Unmarshal(data, &entity_); err != nil {
		r.Logger.Panic(err)
		return nil, err
	}

	return &entity_, nil
}

func (r *DatasetDataRepository) Update(entity *entity.DatasetDataEntity) (*entity.DatasetDataEntity, error) {
	now := time.Now().Unix()
	entity.UpdatedTime = now

	bucket := r.Bucket
	content, err := json.Marshal(entity)
	if err != nil {
		r.Logger.Panic(err)
		return nil, err
	}

	ctx := context.Background()
	ctx, cancel := context.WithTimeout(ctx, time.Second*50)
	defer cancel()

	wc := bucket.Object(getPath(entity.ID)).NewWriter(ctx)
	wc.ContentType = "application/json"
	wc.Metadata = map[string]string{
		"x-goog-meta-user-id":    entity.UserID,
		"x-goog-meta-project-id": r.ProjectId,
	}

	if _, err := wc.Write(content); err != nil {
		r.Logger.Panic(err)
		return nil, err
	}

	if err := wc.Close(); err != nil {
		r.Logger.Panic(err)
		return nil, err
	}

	return entity, nil
}

func (r *DatasetDataRepository) Delete(id string) error {
	ctx := context.Background()
	bucket := r.Bucket

	ctx, cancel := context.WithTimeout(ctx, time.Second*50)
	defer cancel()

	err := bucket.Object(getPath(id)).Delete(ctx)
	if err != nil {
		r.Logger.Panic(err)
	}

	return err
}
