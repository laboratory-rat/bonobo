package service

import (
	repomodel "bonobo.madrat.studio/ms/infrastructure/repository/model"
	"fmt"
	"math"
	"sort"
	"strconv"
	"strings"
	"time"

	"bonobo.madrat.studio/ms/connector"
	entity "bonobo.madrat.studio/ms/domain/entity/dataset"
	"bonobo.madrat.studio/ms/domain/enum"
	"bonobo.madrat.studio/ms/domain/error"
	"bonobo.madrat.studio/ms/domain/model"
	repointerface "bonobo.madrat.studio/ms/infrastructure/repository/interface"
	"bonobo.madrat.studio/ms/utility"
)

// DatasetService to work with datasets
type DatasetService struct {
	Logger                     *utility.Logger
	ConnectorGoogleSpreadsheet *connector.GoogleSpreadsheetsConnector
	DatasetMetadataRepository  repointerface.IDatasetMetadataRepository
	DatasetDataRepository      repointerface.IDatasetDataRepository
}

// NewDatasetService Create service
func NewDatasetService(logger *utility.Logger, connector *connector.GoogleSpreadsheetsConnector, datasetMetadataRepository repointerface.IDatasetMetadataRepository, datasetDataRepository repointerface.IDatasetDataRepository) *DatasetService {
	return &DatasetService{
		ConnectorGoogleSpreadsheet: connector,
		DatasetMetadataRepository:  datasetMetadataRepository,
		Logger:                     logger,
		DatasetDataRepository:      datasetDataRepository,
	}
}

// ReadSpreadsheetAndSave - Create dataset from google sheet id
func (s *DatasetService) ReadSpreadsheetAndSave(spreadsheetID string) ([]*entity.DatasetMetadataEntity, *error.ServiceError) {
	spreadsheet, err := s.ConnectorGoogleSpreadsheet.ReadSpreadsheetById(spreadsheetID)
	if err != nil {
		s.Logger.Fatal("Can not read google spreadsheet")
		return nil, error.New400("googlespreadsheets-unavailable", "Can not read google spreadsheet document")
	}

	if len(spreadsheet.Sheets) == 0 {
		return make([]*entity.DatasetMetadataEntity, 0), nil
	}

	var createdDatasets []*entity.DatasetDataEntity
	for _, sheet := range spreadsheet.Sheets {
		if sheet.Properties.SheetType != "GRID" {
			continue
		}

		sheetTitle := sheet.Properties.Title
		rangeValue, err := s.ConnectorGoogleSpreadsheet.ReadSheetRange(spreadsheetID, sheetTitle, "A:Z")
		if err != nil {
			s.Logger.Fatal(fmt.Sprintf("Can not read google sheet doc. spreadsheet id: %s; sheet id: %s; range: %s", spreadsheetID, sheetTitle, "A:Z"))
			return nil, error.New400("Can not read google document "+sheetTitle, "googlesheets-unavailable")
		}

		grid := rangeValue.Values
		if len(grid[0]) == 0 {
			continue
		}

		var headers []string
		var values [][]string
		skipFirstRow := false

		// handle headers
		for colIndex, col := range grid[0] {
			if col != nil && utility.IsStringAlphabetic(col.(string)) {
				headers = append(headers, col.(string))
				skipFirstRow = true
			} else {
				headers = append(headers, "column-"+strconv.Itoa(colIndex+1))
			}
		}

		// handle values
		for rowIndex, row := range grid {
			if rowIndex == 0 && skipFirstRow {
				continue
			}

			var vRow []string
			for _, val := range row {
				vRow = append(vRow, val.(string))
			}

			values = append(values, vRow)
		}

		if len(values) == 0 || len(headers) == 0 {
			continue
		}

		// aggregate all to cols to suggest types
		var colValues [][]string
		var colTypes []enum.DatasetColType
		for _, rowValue := range values {
			for colIndex, colValue := range rowValue {
				if len(colValues) <= colIndex {
					colValues = append(colValues, make([]string, 0))
				}

				colValues[colIndex] = append(colValues[colIndex], colValue)
			}
		}

		// Create cells and headers
		datasetHeaders := make([]entity.DatasetDataHeaderEntity, len(headers))
		datasetCells := make([][][]interface{}, 0)
		for colIndex, values := range colValues {
			pValues, pType := processColumn(values)
			colTypes = append(colTypes, pType)
			for rowIndex, val := range pValues {
				if len(datasetCells) <= rowIndex {
					datasetCells = append(datasetCells, make([][]interface{}, len(headers)))
				}

				var datasetEntityToCreate []interface{}
				if pType == enum.DatasetColType_ColStringArray {
					var toSave []interface{}
					for _, v := range val {
						toSave = append(toSave, v)
					}

					datasetEntityToCreate = toSave
				} else {
					var toSave []interface{}
					for _, v := range val {
						toSave = append(toSave, v)
					}

					datasetEntityToCreate = toSave
				}

				datasetCells[rowIndex][colIndex] = datasetEntityToCreate
			}

			datasetHeaders[colIndex] = entity.DatasetDataHeaderEntity{
				ColType:     pType,
				Index:       colIndex,
				OriginIndex: colIndex,
				Title:       headers[colIndex],
				Decimals:    0,
				IsOutput:    false,
			}
		}

		createdDatasets = append(createdDatasets, &entity.DatasetDataEntity{
			Name:       sheetTitle,
			Body:       datasetCells,
			Header:     datasetHeaders,
			MetadataID: "",
			UserID:     "USER_ID",
		})
	}

	if len(createdDatasets) == 0 {
		return nil, error.New400("No values found", "googlesheet-read-error")
	}

	var datasetsToSave []*entity.DatasetDataEntity
	for _, d := range createdDatasets {
		saved, err := s.DatasetDataRepository.Create(d)
		if err != nil {
			s.Logger.Fatal(err)
			continue
		}

		datasetsToSave = append(datasetsToSave, saved)
	}

	if len(datasetsToSave) == 0 {
		return nil, error.New400("No datasets created", "no-datasets-created")
	}

	var metadataList []*entity.DatasetMetadataEntity
	for _, dataset := range datasetsToSave {
		metadata := entity.NewMetadataFromDataset(dataset, enum.DatasetSourceType_GoogleWorksheet, spreadsheetID)
		if _, err := s.DatasetMetadataRepository.Create(metadata); err != nil {
			s.Logger.Fatal(err)
		} else {
			metadataList = append(metadataList, metadata)
		}
	}

	return metadataList, nil
}

// List return list of dataset metadata entities
func (s *DatasetService) List(startAfter string, limit int) (*[]entity.DatasetMetadataEntity, *error.ServiceError) {
	if limit < 1 {
		return nil, error.New400("Limit can not be less then 1", "bed-model")
	}

	result, err := s.DatasetMetadataRepository.GetList(&repomodel.SearchFilter{
		StartAfter: &startAfter,
		Limit:      limit,
		Query:      &map[string]string{
			"IsTemporary": "false",
			"IsArchived": "false",
		},
		OrederBy:   &map[string]bool{"created-time": true},
	})

	if err != nil {
		s.Logger.Fatal(err)
		return nil, error.New400("Can not read metadata", "service-error")
	}

	return result, nil
}

// Read - Read dataset
func (s *DatasetService) Read(metadataID string, skip int, limit int) (*entity.DatasetDataEntity, *error.ServiceError) {
	_, dataset, err := s.getMetadataAndDataset(metadataID)
	if err != nil {
		return nil, err
	}

	skip = int(math.Min(float64(skip), float64(len(dataset.Body))))
	limit = int(math.Min(float64(limit), float64(len(dataset.Body))))
	dataset.Body = dataset.Body[skip:limit]
	return dataset, nil
}

// Approve - Remove is temporary marker from dataset and delete extra columns
func (s *DatasetService) Approve(metadataID string, m model.DatasetApproveModel) *error.ServiceError {
	if len(m.Header) == 0 {
		return error.New400("No entities selected", "bad-model")
	}

	metadata, dataset, err := s.getMetadataAndDataset(metadataID)
	if err != nil {
		return err
	}

	dataset.Name = m.Name

	sort.SliceStable(m.Header, func(i, j int) bool {
		return m.Header[i].Index < m.Header[j].Index
	})

	var updatedHeader []entity.DatasetDataHeaderEntity;

	for _, entityHeader := range dataset.Header {
		var matchHeader *model.DatasetApproveModelHeader
		for _, mh := range m.Header {
			if mh.OriginIndex == entityHeader.Index {
				matchHeader = &mh
				break
			}
		}

		if matchHeader == nil {
			continue
		}

		updatedHeader = append(updatedHeader, entity.DatasetDataHeaderEntity{
			ColType:     entityHeader.ColType,
			Decimals:    matchHeader.Decimals,
			Index:       matchHeader.Index,
			OriginIndex: entityHeader.OriginIndex,
			Title:       matchHeader.Title,
			IsOutput:  matchHeader.IsOutput,
		})
	}

	// oldYSize, newYSize := len(dataset.Header), len(updatedHeader)
	dataset.Header = updatedHeader
	var updatedBody [][][]interface{}
	for _, row := range dataset.Body {
		var updatedRow [][]interface{};
		for _, uh := range updatedHeader {
			updatedRow = append(updatedRow, row[uh.OriginIndex])
		}

		updatedBody = append(updatedBody, updatedRow)
	}

	dataset.Body = updatedBody
	updatedMetadata := entity.NewMetadataFromDataset(dataset, metadata.SourceType, metadata.SourceReference)
	updatedMetadata.ID = metadata.ID
	dataset.MetadataID = updatedMetadata.ID
	updatedMetadata.ProcessType = metadata.ProcessType
	updatedMetadata.CreatedTime = metadata.CreatedTime
	updatedMetadata.UpdatedTime = metadata.UpdatedTime
	updatedMetadata.LastSyncTime = metadata.LastSyncTime
	updatedMetadata.IsTemporary = false

	dataset, er := s.DatasetDataRepository.Update(dataset)
	if er != nil {
		s.Logger.Fatal(er)
		return error.New400("Can not save dataset", "dataset-write")
	}

	updatedMetadata, er = s.DatasetMetadataRepository.Update(updatedMetadata)
	if er != nil {
		s.Logger.Fatal(er)
		return error.New400("Can not save dataset metadata", "metadata-write")
	}

	return nil
}

// DeleteExpired - Delete all temporary and expired datasets with metadata
func (s *DatasetService) DeleteExpired() {
	metadatas, err := s.DatasetMetadataRepository.GetExpired()
	if err != nil {
		s.Logger.Panic(err)
		return
	}

	if len(metadatas) == 0 {
		return
	}

	for _, m := range metadatas {
		err = s.DatasetMetadataRepository.DeleteByID(m.ID)
		if err != nil {
			s.Logger.Fatal("Can not delete expired metadata: %s", m.ID)
			continue
		}

		err = s.DatasetDataRepository.Delete(m.DatasetReference)
		if err != nil {
			s.Logger.Fatal("Can not delete expired dataset: %s", m.DatasetReference)
		}
	}
}

// Archive - Archive metadata
func (s *DatasetService) Archive(ID string) *error.ServiceError {
	metadata, err := s.DatasetMetadataRepository.GetByID(ID)
	if err != nil {
		return error.New400("Can not archive metadata", "metadata-archive-error")
	}

	metadata.IsArchived = true
	metadata.ArchivedTime = time.Now().Unix()
	metadata, err = s.DatasetMetadataRepository.Update(metadata)
	if err != nil {
		return error.New400("Can not archive metadata", "metadata-archive-error")
	}

	return nil
}

func processColumn(data []string) ([][]interface{}, enum.DatasetColType) {
	isArray := 0
	isArrayNumbers := 0
	isNumber := 0
	total := len(data)

	arrayStringToFloat := func(input []string) []float64 {
		var result []float64
		for _, element := range input {
			s, _ := strconv.ParseFloat(element, 64)
			result = append(result, s)
		}

		return result
	}

	for _, d := range data {
		if utility.IsStringJsonArray(d) {
			isArray++
			if utility.IsStringJsonArrayNumbers(d) {
				isArrayNumbers++
			}
		} else if utility.IsStringNumber(d) {
			isNumber++
		}
	}

	var result [][]interface{}
	colType := enum.DatasetColType_ColStringArray

	if isArrayNumbers == total {
		colType = enum.DatasetColType_ColNumberArray
		for _, d := range data {
			processed := strings.Trim(d, " _![]")
			splitted := strings.Split(processed, ",")
			parsed := arrayStringToFloat(splitted)
			converted := make([]interface{}, len(parsed))

			for _, p := range parsed {
				converted = append(converted, p)
			}

			result = append(result, converted)
		}
	} else if isArray == total {
		colType = enum.DatasetColType_ColStringArray
		for _, d := range data {
			processed := strings.Trim(d, " _![]")
			parsed := strings.Split(processed, ",")
			converted := make([]interface{}, len(parsed))

			for _, p := range parsed {
				converted = append(converted, p)
			}

			result = append(result, converted)
		}
	} else if isNumber == total {
		colType = enum.DatasetColType_ColNumberArray
		for _, d := range data {
			parsed, _ := strconv.ParseFloat(d, 64)
			converted := []interface{}{parsed}
			result = append(result, converted)
		}
	} else {
		colType = enum.DatasetColType_ColStringArray
		for _, d := range data {
			converted := []interface{}{d}
			result = append(result, converted)
		}
	}

	return result, colType
}

func (s *DatasetService) getMetadataAndDataset(metadataID string) (*entity.DatasetMetadataEntity, *entity.DatasetDataEntity, *error.ServiceError) {
	metadata, err := s.DatasetMetadataRepository.GetByID(metadataID)
	if err != nil {
		return nil, nil, error.New400("Metadata not found", "not-found")
	}

	dataset, err := s.DatasetDataRepository.Read(metadata.DatasetReference)
	if err != nil {
		return nil, nil, error.New400("Dataset not found", "not-found")
	}

	return metadata, dataset, nil
}
