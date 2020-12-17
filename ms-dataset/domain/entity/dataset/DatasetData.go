package entity

import "bonobo.madrat.studio/ms/domain/enum"

// DatasetDataEntity - Basic type for data store
type DatasetDataEntity struct {
	ID          string                    `json:"id"`
	Name        string                    `json:"name"`
	MetadataID  string                    `json:"metadata_id"`
	UserID      string                    `json:"user_id"`
	Header      []DatasetDataHeaderEntity `json:"header"`
	Body        [][][]interface{}         `json:"body"`
	CreatedTime int64                     `json:"created_time"`
	UpdatedTime int64                     `json:"updated_time"`
}

// DatasetDataHeaderEntity - Explain data cols types and names
type DatasetDataHeaderEntity struct {
	OriginIndex int                 `json:"origin_index"`
	Index       int                 `json:"index"`
	Title       string              `json:"title"`
	ColType     enum.DatasetColType `json:"col_type"`
	Decimals    int8                `json:"decimals"`
}

// NewDatasetDataEntity - Create new data entity
func NewDatasetDataEntity(userID string, name string, header []DatasetDataHeaderEntity, body [][][]interface{}) *DatasetDataEntity {
	return &DatasetDataEntity{
		Name:       name,
		MetadataID: "NULL",
		UserID:     userID,
		Header:     header,
		Body:       body,
	}
}
