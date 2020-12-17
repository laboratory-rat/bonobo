package model

// DatasetApproveModel - Approve dataset after creation
// Will not be deleted after it
type DatasetApproveModel struct {
	Name   string                      `json:"name"`
	Header []DatasetApproveModelHeader `json:"header"`
}

// DatasetApproveModelHeader - Dataset header options
type DatasetApproveModelHeader struct {
	OriginIndex int    `json:"origin_index"`
	Index       int    `json:"index"`
	Title       string `json:"title"`
	Decimals    int8   `json:"decimals"`
}
