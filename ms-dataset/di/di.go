package di

import (
	"bonobo.madrat.studio/ms/connector"
	"bonobo.madrat.studio/ms/controller"
	repoinstance "bonobo.madrat.studio/ms/infrastructure/repository/instance"
	repointerface "bonobo.madrat.studio/ms/infrastructure/repository/interface"
	"bonobo.madrat.studio/ms/infrastructure/service"
	"bonobo.madrat.studio/ms/utility"

	"go.uber.org/dig"

	"os"
)

// Container - All application dependencies
var Container *dig.Container

// BuildContainer - Init and prepare all instances
func BuildContainer() *dig.Container {
	vFirebaseConfig := os.Getenv("BNB-FIREBASE-CONFIG")
	vFirebase := os.Getenv("BNB-FIREBASE-CREDENTIALS")

	Container = dig.New()

	// Logger
	err := Container.Provide(func() *utility.Logger {
		logger, _ := utility.NewLogger("mr-bonobo", "mr-bonobo-dev")
		return logger
	})
	if err != nil {
		panic(err)
	}

	// App firebase connector
	err = Container.Provide(func() (*connector.AppFirebase, error) {
		connector, err := connector.NewFirebaseConnectorFromJSON(vFirebase, vFirebaseConfig)
		return connector, err
	})
	if err != nil {
		panic(err)
	}

	// App google spreadsheet connector
	err = Container.Provide(func() (*connector.GoogleSpreadsheetsConnector, error) {
		connector, err := connector.NewGoogleSpreadsheetConnectorFromJSON(vFirebase)
		return connector, err
	})
	if err != nil {
		panic(err)
	}

	// Dataset metadata repository
	err = Container.Provide(func(appFirebase *connector.AppFirebase) repointerface.IDatasetMetadataRepository {
		return repoinstance.NewDatasetMetadataRepository(appFirebase, "dataset_metadata")
	})
	if err != nil {
		panic(err)
	}

	// Dataset data repository
	err = Container.Provide(func(logger *utility.Logger, appFirebase *connector.AppFirebase) repointerface.IDatasetDataRepository {
		return repoinstance.NewDatasetDataRepository(logger, appFirebase)
	})
	if err != nil {
		panic(err)
	}

	//Dataset service
	err = Container.Provide(func(logger *utility.Logger, connector *connector.GoogleSpreadsheetsConnector, datasetMetadataRepository repointerface.IDatasetMetadataRepository, datasetDataRepository repointerface.IDatasetDataRepository) *service.DatasetService {
		return service.NewDatasetService(logger, connector, datasetMetadataRepository, datasetDataRepository)
	})
	if err != nil {
		panic(err)
	}

	// Dataset controller
	err = Container.Provide(func(service *service.DatasetService) *controller.DatasetController {
		return controller.NewDatasetController(service)
	})
	if err != nil {
		panic(err)
	}

	return Container
}
