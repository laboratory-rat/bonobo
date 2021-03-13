package entity

import (
	"math"

	"bonobo.madrat.studio/ms/domain/enum"
	"bonobo.madrat.studio/ms/utility"
)

// DatasetMetadataEntity - Short info about dataset
type DatasetMetadataEntity struct {
	ID               string                        `firestore:"id" json:"id"`
	Name             string                        `firestore:"name" json:"name"`
	UserID           string                        `firestore:"user_id" json:"userID"`
	Header           []DatasetMetadataHeaderEntity `firestore:"header" json:"header"`
	Examples         []DatasetMetadataColEntity    `firestore:"examples" json:"examples"`
	Size             int                           `firestore:"size" json:"size"`
	ProcessType      enum.DatasetProcessType       `firestore:"dataset_process_type" json:"datasetProcessType"`
	DatasetReference string                        `firestore:"dataset_reference" json:"datasetReference"`
	SourceType       enum.DatasetSourceType        `firestore:"source_type" json:"sourceType"`
	SourceReference  string                        `firestore:"source_reference" json:"sourceReference"`
	IsTemporary      bool                          `firestore:"is_temporary" json:"isTemporary"`
	IsArchived       bool                          `firestore:"is_archived" json:"isArchived"`
	CreatedTime      int64                         `firestore:"created_time" json:"createdTime"`
	UpdatedTime      int64                         `firestore:"updated_time" json:"updatedTime"`
	LastSyncTime     int64                         `firestore:"last_sync_time" json:"lastSyncTime"`
	ArchivedTime     int64                         `firestore:"archived_time" json:"archivedTime"`
}

// DatasetMetadataHeaderEntity - Header preview
type DatasetMetadataHeaderEntity struct {
	Title       string              `firestore:"title" json:"title"`
	Index       int                 `firestore:"index" json:"index"`
	OriginIndex int                 `firestore:"originIndex" json:"originIndex"`
	ColType     enum.DatasetColType `firestore:"type" json:"type"`
	Decimals    int8                `firestore:"decimals" json:"decimals"`
	IsOutput    bool                `firestore:"isOutput" json:"isOutput"`
}

// DatasetMetadataColEntity - Column representation
type DatasetMetadataColEntity struct {
	Value []DatasetMetadataCellEntity `firestore:"value" json:"value"`
}

// DatasetMetadataCellEntity -
type DatasetMetadataCellEntity struct {
	Value []interface{} `firestore:"value" json:"value"`
}

// NewMetadataFromDataset - Create new entity from data entity
func NewMetadataFromDataset(dataset *DatasetDataEntity, sourceType enum.DatasetSourceType, sourceReference string) *DatasetMetadataEntity {
	var header []DatasetMetadataHeaderEntity
	var examples []DatasetMetadataColEntity
	cells := dataset.Body[0:int(math.Min(float64(len(dataset.Body)), float64(3)))]

	for hIndex, h := range dataset.Header {
		header = append(header, DatasetMetadataHeaderEntity{
			Title:       h.Title,
			ColType:     h.ColType,
			Index:       hIndex,
			OriginIndex: hIndex,
			IsOutput:    h.IsOutput,
			Decimals:    h.Decimals,
		})
	}

	for _, col := range cells {
		var processedRow []DatasetMetadataCellEntity
		for _, cell := range col {
			processedRow = append(processedRow, DatasetMetadataCellEntity{Value: cell})
		}

		examples = append(examples, DatasetMetadataColEntity{Value: processedRow})
	}

	return &DatasetMetadataEntity{
		ID:               utility.GenerateRandomId(),
		Name:             dataset.Name,
		UserID:           dataset.UserID,
		ProcessType:      enum.DatasetProcessType_Training,
		Header:           header,
		Examples:         examples,
		Size:             len(dataset.Body),
		DatasetReference: dataset.ID,
		SourceType:       sourceType,
		SourceReference:  sourceReference,
		IsTemporary:      true,
		IsArchived:       false,
	}
}
