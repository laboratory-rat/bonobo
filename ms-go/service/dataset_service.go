package service

import (
	"fmt"
	"math"
	"strconv"
	"strings"

	"bonobo.madrat.studio/ms/connector"
	entity "bonobo.madrat.studio/ms/domain/entity/dataset"
	"bonobo.madrat.studio/ms/domain/enum"
	error "bonobo.madrat.studio/ms/domain/error"
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
		datasetCells := make([][]entity.IDatasetCellEntity, 0)
		for colIndex, values := range colValues {
			pValues, pType := processColumn(values)
			colTypes = append(colTypes, pType)
			for rowIndex, val := range pValues {
				if len(datasetCells) <= rowIndex {
					datasetCells = append(datasetCells, make([]entity.IDatasetCellEntity, len(headers)))
				}

				var datasetEntityToCreate entity.IDatasetCellEntity
				if pType == enum.DatasetColType_ColStringArray {
					var toSave []string
					for _, v := range val {
						toSave = append(toSave, v.(string))
					}

					datasetEntityToCreate = &entity.DatasetCellString{
						Value: toSave,
					}
				} else {
					var toSave []float64
					for _, v := range val {
						toSave = append(toSave, v.(float64))
					}

					datasetEntityToCreate = &entity.DatasetCellNumber{
						Value: toSave,
					}
				}

				datasetCells[rowIndex][colIndex] = datasetEntityToCreate
			}

			datasetHeaders[colIndex] = entity.DatasetDataHeaderEntity{
				ColType: pType,
				Index:   colIndex,
				Title:   headers[colIndex],
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

	var metadatas []*entity.DatasetMetadataEntity
	for _, dataset := range datasetsToSave {
		metadata := entity.NewMetadataFromDataset(dataset, enum.DatasetSourceType_GoogleWorksheet)
		if _, err := s.DatasetMetadataRepository.Create(metadata); err != nil {
			s.Logger.Fatal(err)
		} else {
			metadatas = append(metadatas, metadata)
		}
	}

	return metadatas, nil
}

// Read - Read dataset
func (s *DatasetService) Read(metadataID string, skip int, limit int) (*entity.DatasetDataEntity, *error.ServiceError) {
	metadata, err := s.DatasetMetadataRepository.GetById(metadataID)
	if err != nil {
		return nil, error.New400("Metadata not found", "not-found")
	}

	dataset, err := s.DatasetDataRepository.Read(metadata.SourceReference)
	if err != nil {
		return nil, error.New400("Dataset not found", "not-found")
	}

	skip = int(math.Min(float64(skip), float64(len(dataset.Body))))
	limit = int(math.Min(float64(limit), float64(len(dataset.Body))))
	dataset.Body = dataset.Body[skip:limit]
	return dataset, nil
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
