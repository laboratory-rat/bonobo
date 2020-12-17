package main

import (
	"os"

	"bonobo.madrat.studio/ms/router"
)

func main() {
	port := os.Getenv("BNB_PORT")

	router := router.Build()
	router.Run(":" + port)
}
