package utility

import (
	"context"
	"log"

	"cloud.google.com/go/logging"
)

// Logger - Simple in app logger
type Logger struct {
	ProjectID string
	Logger    *logging.Logger
}

// NewLogger - Create new logger
func NewLogger(projectID string, appName string) (*Logger, error) {
	ctx := context.Background()
	client, err := logging.NewClient(ctx, projectID)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
		return nil, err
	}
	// defer client.Close()

	return &Logger{
		ProjectID: projectID,
		Logger:    client.Logger(appName),
	}, nil
}

// Info - Send info log
func (l *Logger) Info(text ...interface{}) {
	l.Logger.StandardLogger(logging.Info).Println("Info: {}", text)
}

// Fatal - Send Fatal log
func (l *Logger) Fatal(text ...interface{}) {
	l.Logger.StandardLogger(logging.Info).Println("FATAL: {}", text)

}

// Panic - Send Panic log
func (l *Logger) Panic(text ...interface{}) {
	l.Logger.StandardLogger(logging.Info).Println("PANIC: {}", text)
}
