package enum

type DatasetProcessType string

const (
	DatasetProcessType_Training = DatasetProcessType("TRAINING")
	DatasetColType_Validation   = DatasetProcessType("VALIDATION")
	DatasetColType_Prediction   = DatasetProcessType("PREDICTION")
)
