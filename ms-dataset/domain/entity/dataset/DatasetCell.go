package entity

import (
	"strconv"

	"bonobo.madrat.studio/ms/utility"
)

// IDatasetCellEntity - Cell content
type IDatasetCellEntity interface {
	ReadNumbers(roundDecimals *int8) []float64
	ReadStrings() []string
	Length() int
}

// DatasetCellNumber - Cell for numberic content
type DatasetCellNumber struct {
	Value []float64 `json:"value"`
}

// DatasetCellString - Cell for string content
type DatasetCellString struct {
	Value []string `json:"value"`
}

func (cell DatasetCellNumber) ReadNumbers(roundDecimals *int8) []float64 {
	result := []float64{}
	for i, r := range cell.Value {
		result[i] = utility.RoundNumber(r, roundDecimals)
	}

	return result
}

func (cell DatasetCellNumber) ReadStrings() []string {
	var result []string
	for _, r := range cell.Value {
		result = append(result, strconv.FormatFloat(r, 'g', -1, 32))
	}

	return result
}

func (cell DatasetCellNumber) Length() int {
	return len(cell.Value)
}

func (cell DatasetCellString) ReadNumbers(roundDecimals *int8) []float64 {
	return []float64{}
}

func (cell DatasetCellString) ReadStrings() []string {
	return cell.Value
}

func (cell DatasetCellString) Length() int {
	return len(cell.Value)
}
