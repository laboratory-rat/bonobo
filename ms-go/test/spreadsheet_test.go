package test

import (
	"fmt"
	"testing"

	"bonobo.madrat.studio/ms/connector"
)

func TestSpreadsheetsRead(t *testing.T) {
	spreadsheetReader, err := connector.NewGoogleSpreadsheetConnectorFromJSON("../credentials-gsa.json")
	if err != nil {
		t.Error(err)
	}

	result, err := spreadsheetReader.ReadSpreadsheetById("1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms")
	if err != nil {
		t.Error(err)
	}

	fmt.Println(result)
}
