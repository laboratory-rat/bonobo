package entity

import "bonobo.madrat.studio/ms/domain/enum"

// DatasetDataEntity - Basic type for data store
type DatasetDataEntity struct {
	ID          string                    `json:"id"`
	Name        string                    `json:"name"`
	MetadataID  string                    `json:"metadataID"`
	UserID      string                    `json:"userID"`
	Header      []DatasetDataHeaderEntity `json:"header"`
	Body        [][][]interface{}         `json:"body"`
	CreatedTime int64                     `json:"createdTime"`
	UpdatedTime int64                     `json:"updatedTime"`
}

// DatasetDataHeaderEntity - Explain data cols types and names
type DatasetDataHeaderEntity struct {
	OriginIndex int                 `json:"originIndex"`
	Index       int                 `json:"index"`
	Title       string              `json:"title"`
	ColType     enum.DatasetColType `json:"colType"`
	Decimals    int8                `json:"decimals"`
	IsOutput    bool                `json:"isOutput"`
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
