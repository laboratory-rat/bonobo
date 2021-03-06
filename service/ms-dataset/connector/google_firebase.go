package connector

import (
	"context"

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
func NewFirebaseConnectorFromJSON(credentialsPath string, projectID string, databaseURL string, storageURL string) (*AppFirebase, error) {
	config := firebase.Config{
		ProjectID:     projectID,
		DatabaseURL:   databaseURL,
		StorageBucket: storageURL,
	}

	opt := option.WithCredentialsFile(credentialsPath)
	return NewFirebaseConnectorFromOptions(opt, &config)
}
