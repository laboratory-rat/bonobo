package enum

type DatasetSourceType string

const (
	DatasetSourceType_GoogleWorksheet DatasetSourceType = DatasetSourceType("GOOGLE_WORKSHEET")
	DatasetSourceType_UploadedFile                      = DatasetSourceType("UPLOADED_FILE")
)
