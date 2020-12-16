package router

import (
	"net/http"

	"bonobo.madrat.studio/ms/controller"
	"bonobo.madrat.studio/ms/di"
	"github.com/gin-gonic/gin"
)

func Build() *gin.Engine {
	container := di.BuildContainer()
	r := gin.Default()

	v1 := r.Group("/v1")
	{
		err := container.Invoke(func(c *controller.DatasetController) {
			dataset := v1.Group("/dataset")
			{
				dataset.GET("/create/spreadsheet/:id", c.CreateFromSpreadsheet)
				dataset.GET("/read/:id/:skip/:limit", c.Read)
				dataset.PUT("/prepare/:id", c.Prepare)
				dataset.DELETE("/delete/:id", c.Delete)
			}
		})

		if err != nil {
			panic(err)
		}
	}

	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "hello world"})
	})

	return r
}
