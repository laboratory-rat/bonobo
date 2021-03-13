package connector

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/jwt"
	"google.golang.org/api/sheets/v4"
)

type GoogleSpreadsheetsConnector struct {
	Client *http.Client
}

func NewGoogleSpreadsheetConnectorFromJSON(credentialsPath string) (*GoogleSpreadsheetsConnector, error) {
	b, err := ioutil.ReadFile(credentialsPath)
	if err != nil {
		return nil, err
	}

	var parseResult map[string]interface{}
	err = json.Unmarshal(b, &parseResult)
	if err != nil {
		return nil, err
	}

	config := &jwt.Config{
		Email:        parseResult["client_email"].(string),
		PrivateKey:   []byte(parseResult["private_key"].(string)),
		PrivateKeyID: parseResult["private_key_id"].(string),
		TokenURL:     parseResult["token_uri"].(string),
		Scopes: []string{
			"https://www.googleapis.com/auth/spreadsheets.readonly",
		},
	}

	client := config.Client(oauth2.NoContext)
	return &GoogleSpreadsheetsConnector{
		Client: client,
	}, nil
}

func (c *GoogleSpreadsheetsConnector) ReadSpreadsheetById(id string) (*sheets.Spreadsheet, error) {
	srv, err := sheets.New(c.Client)
	if err != nil {
		return nil, err
	}

	return srv.Spreadsheets.Get(id).Do()
}

// ReadSheetRange - Read single spreadsheet sheet document
// use A:Z as 'all' range
func (c *GoogleSpreadsheetsConnector) ReadSheetRange(spreadsheetId string, sheetName string, range_ string) (*sheets.ValueRange, error) {
	srv, err := sheets.New(c.Client)
	if err != nil {
		return nil, err
	}

	return srv.Spreadsheets.Values.Get(spreadsheetId, fmt.Sprintf("%s!%s", sheetName, range_)).Do()
}
