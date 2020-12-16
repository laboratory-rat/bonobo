package main

import (
	"bonobo.madrat.studio/ms/router"
)

func main() {
	router := router.Build()
	router.Run(":4564")
}
