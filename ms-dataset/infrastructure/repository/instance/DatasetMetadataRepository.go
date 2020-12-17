package repoinstance

import (
	"context"
	"time"

	"bonobo.madrat.studio/ms/connector"
	entity "bonobo.madrat.studio/ms/domain/entity/dataset"
	repomodel "bonobo.madrat.studio/ms/infrastructure/repository/model"
	"bonobo.madrat.studio/ms/utility"
	firestore "cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

type DatasetMetadataRepository struct {
	AppFirebase *connector.AppFirebase
	Client      *firestore.Client
	Collection  string
	Context     context.Context
}

func NewDatasetMetadataRepository(appFirebase *connector.AppFirebase, collection string) *DatasetMetadataRepository {
	return &DatasetMetadataRepository{
		AppFirebase: appFirebase,
		Client:      appFirebase.Firestore,
		Collection:  collection,
		Context:     context.Background(),
	}
}

func (r *DatasetMetadataRepository) collection() *firestore.CollectionRef {
	return r.Client.Collection(r.Collection)
}

func (r *DatasetMetadataRepository) Create(e *entity.DatasetMetadataEntity) (*entity.DatasetMetadataEntity, error) {
	now := time.Now().Unix()
	e.ID = utility.GenerateRandomId()
	e.CreatedTime = now
	e.UpdatedTime = now
	e.LastSyncTime = now
	_, err := r.collection().Doc(e.ID).Set(r.Context, e)
	return e, err
}

func (r *DatasetMetadataRepository) GetList(filter *repomodel.SearchFilter) (*[]entity.DatasetMetadataEntity, error) {
	ref := r.collection().OrderBy("created_time", firestore.Desc).Limit(filter.Limit)
	if filter.StartAfter != nil {
		ref.StartAfter(filter.StartAfter)
	}

	iter := ref.Documents(r.Context)
	var result []entity.DatasetMetadataEntity
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}

		if err != nil {
			return nil, err
		}

		var parsed entity.DatasetMetadataEntity
		parseErr := doc.DataTo(&parsed)
		if parseErr != nil {
			return nil, parseErr
		}

		result = append(result, parsed)
	}

	return &result, nil
}

// GetExpared - Get all expared metadatas
// TODO: Remove this method and use simple query from service
func (r *DatasetMetadataRepository) GetExpired() ([]*entity.DatasetMetadataEntity, error) {
	var result []*entity.DatasetMetadataEntity

	ref := r.collection().OrderBy("archived_time", firestore.Desc).Limit(20)
	query := ref.Where("is_archived", "==", "true")
	query = query.Where("archived_time", "<=", time.Now().AddDate(0, -1, 0).Unix())
	iter := query.Documents(r.Context)

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}

		if err != nil {
			return nil, err
		}

		var parsed entity.DatasetMetadataEntity
		parseErr := doc.DataTo(&parsed)
		if parseErr != nil {
			return nil, parseErr
		}

		result = append(result, &parsed)
	}

	ref = r.collection().OrderBy("created_time", firestore.Desc).Limit(20)
	query = ref.Where("is_temporary", "==", "true")
	query = query.Where("created_time", "<=", time.Now().Add(-30*time.Minute).Unix())
	iter = query.Documents(r.Context)

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}

		if err != nil {
			return nil, err
		}

		var parsed entity.DatasetMetadataEntity
		parseErr := doc.DataTo(&parsed)
		if parseErr != nil {
			return nil, parseErr
		}

		result = append(result, &parsed)
	}

	return result, nil
}

// GetByID - Get metadata by ID if exists
func (r *DatasetMetadataRepository) GetByID(ID string) (*entity.DatasetMetadataEntity, error) {
	doc, err := r.collection().Doc(ID).Get(r.Context)
	if err != nil {
		return nil, err
	}

	var result entity.DatasetMetadataEntity
	err = doc.DataTo(&result)
	return &result, err
}

func (r *DatasetMetadataRepository) Update(e *entity.DatasetMetadataEntity) (*entity.DatasetMetadataEntity, error) {
	e.UpdatedTime = time.Now().Unix()
	_, err := r.collection().Doc(e.ID).Set(r.Context, e)
	return e, err
}

func (r *DatasetMetadataRepository) DeleteByID(id string) error {
	_, err := r.collection().Doc(id).Delete(r.Context)
	return err
}
