package connector

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"os"

	"cloud.google.com/go/firestore"
	"cloud.google.com/go/storage"
	firebase "firebase.google.com/go/v4"
	storage_firebase "firebase.google.com/go/v4/storage"
	"google.golang.org/api/option"
)

// AppFirebase - Firebase utils bundle
type AppFirebase struct {
	Config    *firebase.Config
	App       *firebase.App
	Firestore *firestore.Client
	Storage   *storage_firebase.Client
	Bucket    *storage.BucketHandle
}

// NewFirebaseConnectorFromOptions - Create new connector from options
func NewFirebaseConnectorFromOptions(options option.ClientOption, config *firebase.Config) (*AppFirebase, error) {
	app, err := firebase.NewApp(context.Background(), config, options)
	if err != nil {
		return nil, err
	}

	firestore, err := app.Firestore(context.Background())
	if err != nil {
		return nil, err
	}

	storage, err := app.Storage(context.Background())
	if err != nil {
		return nil, err
	}

	bucket, err := storage.DefaultBucket()
	if err != nil {
		return nil, err
	}

	return &AppFirebase{
		Config:    config,
		App:       app,
		Firestore: firestore,
		Storage:   storage,
		Bucket:    bucket,
	}, nil
}

// NewFirebaseConnectorFromJSON - Create new connector from json file
func NewFirebaseConnectorFromJSON(credentialsPath string, configPath string) (*AppFirebase, error) {
	configFile, err := os.Open(configPath)
	if err != nil {
		return nil, err
	}

	defer configFile.Close()

	configContent, err := ioutil.ReadAll(configFile)
	if err != nil {
		return nil, err
	}

	var config firebase.Config
	err = json.Unmarshal(configContent, &config)
	if err != nil {
		return nil, err
	}

	opt := option.WithCredentialsFile(credentialsPath)
	return NewFirebaseConnectorFromOptions(opt, &config)
}
