package consts

import (
	"encoding/json"
	"io/ioutil"
)

type ConstantsProvider struct {
}

func ReadConstantsProviderFromFile(path string) (*ConstantsProvider, error) {
	b, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var provider ConstantsProvider
	err = json.Unmarshal(b, &provider)
	return &provider, err
}
