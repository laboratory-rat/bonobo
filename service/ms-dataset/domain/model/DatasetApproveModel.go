package model

import "bonobo.madrat.studio/ms/domain/enum"

// DatasetApproveModel - Approve dataset after creation
// Will not be deleted after it
type DatasetApproveModel struct {
	Name               string                      `json:"name"`
	DatasetProcessType enum.DatasetProcessType     `json:"datasetProcessType"`
	Header             []DatasetApproveModelHeader `json:"header"`
}

// DatasetApproveModelHeader - Dataset header options
type DatasetApproveModelHeader struct {
	OriginIndex int    `json:"originIndex"`
	Index       int    `json:"index"`
	Title       string `json:"title"`
	Decimals    int8   `json:"decimals"`
	IsOutput    bool   `json:"isOutput"`
}
