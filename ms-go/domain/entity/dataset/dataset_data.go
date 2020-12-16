package entity

import "bonobo.madrat.studio/ms/domain/enum"

// DatasetDataEntity - Basic type for data store
type DatasetDataEntity struct {
	ID          string                    `json:"id"`
	Name        string                    `json:"name"`
	MetadataID  string                    `json:"metadata_id"`
	UserID      string                    `json:"user_id"`
	Header      []DatasetDataHeaderEntity `json:"header"`
	Body        [][]IDatasetCellEntity    `json:"body"`
	CreatedTime int64                     `json:"created_time"`
	UpdatedTime int64                     `json:"updated_time"`
}

// DatasetDataHeaderEntity - Explain data cols types and names
type DatasetDataHeaderEntity struct {
	Index    int
	Title    string
	ColType  enum.DatasetColType
	Decimals int8
}

// NewDatasetDataEntity - Create new data entity
func NewDatasetDataEntity(userID string, name string, header []DatasetDataHeaderEntity, body [][]IDatasetCellEntity) *DatasetDataEntity {
	return &DatasetDataEntity{
		Name:       name,
		MetadataID: "NULL",
		UserID:     userID,
		Header:     header,
		Body:       body,
	}
}
