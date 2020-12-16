package entity

import (
	"math"

	"bonobo.madrat.studio/ms/domain/enum"
	"bonobo.madrat.studio/ms/utility"
)

// DatasetMetadataEntity - Short info about dataset
type DatasetMetadataEntity struct {
	ID              string                        `firestore:"id" json:"id"`
	Name            string                        `firestore:"name" json:"name"`
	UserID          string                        `firestore:"user_id" json:"user_id"`
	Header          []DatasetMetadataHeaderEntity `firestore:"header" json:"header"`
	Examples        []DatasetMetadataColEntity    `firestore:"examples" json:"examples"`
	Size            int                           `firestore:"size" json:"size"`
	SourceType      enum.DatasetSourceType        `firestore:"source_type" json:"source_type"`
	SourceReference string                        `firestore:"source_reference" json:"source_reference"`
	IsTemporary     bool                          `firestore:"is_temporary" json:"is_temporary"`
	CreatedTime     int64                         `firestore:"created_time" json:"created_time"`
	UpdatedTime     int64                         `firestore:"updated_time" json:"updated_time"`
	LastSyncTime    int64                         `firestore:"last_sync_time" json:"last_sync_time"`
}

// DatasetMetadataHeaderEntity - Header preview
type DatasetMetadataHeaderEntity struct {
	Title   string              `firestore:"title" json:"title"`
	ColType enum.DatasetColType `firestore:"type" json:"type"`
}

// DatasetMetadataColEntity - Column representation
type DatasetMetadataColEntity struct {
	Value []DatasetMetadataCellEntity `firestore:"value" json:"value"`
}

// DatasetMetadataCellEntity -
type DatasetMetadataCellEntity struct {
	Value []string `firestore:"value" json:"value"`
}

// NewMetadataFromDataset - Create new enity from data entity
func NewMetadataFromDataset(dataset *DatasetDataEntity, sourceType enum.DatasetSourceType) *DatasetMetadataEntity {
	var header []DatasetMetadataHeaderEntity
	var examples []DatasetMetadataColEntity
	cells := dataset.Body[0:int(math.Min(float64(len(dataset.Body)), float64(3)))]

	for _, h := range dataset.Header {
		header = append(header, DatasetMetadataHeaderEntity{
			Title:   h.Title,
			ColType: h.ColType,
		})
	}

	for _, row := range cells {
		var processedRow []DatasetMetadataCellEntity
		for _, col := range row {
			processedRow = append(processedRow, DatasetMetadataCellEntity{Value: col.ReadStrings()})
		}

		examples = append(examples, DatasetMetadataColEntity{Value: processedRow})
	}

	return &DatasetMetadataEntity{
		ID:              utility.GenerateRandomId(),
		Name:            dataset.Name,
		UserID:          dataset.UserID,
		Header:          header,
		Examples:        examples,
		Size:            len(dataset.Body),
		SourceType:      sourceType,
		SourceReference: dataset.ID,
		IsTemporary:     true,
	}
}
