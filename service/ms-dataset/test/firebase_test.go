package test

import (
	"testing"

	"bonobo.madrat.studio/ms/connector"
)

func TestFirebaseConfig(t *testing.T) {
	_, err := connector.NewFirebaseConnectorFromJSON("credentials-firebase.json")
	if err != nil {
		t.Error(err)
	}
}
