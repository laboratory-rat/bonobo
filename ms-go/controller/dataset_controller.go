package controller

import (
	"bonobo.madrat.studio/ms/domain/error"
	"bonobo.madrat.studio/ms/service"
	"bonobo.madrat.studio/ms/utility"
	"github.com/gin-gonic/gin"
)

type DatasetController struct {
	Service *service.DatasetService
}

func NewDatasetController(service *service.DatasetService) *DatasetController {
	return &DatasetController{
		Service: service,
	}
}

func (ct *DatasetController) CreateFromSpreadsheet(c *gin.Context) {
	id := c.Param("id")
	result, err := ct.Service.ReadSpreadsheetAndSave(id)
	if err != nil {
		c.AbortWithStatusJSON(err.Code, err)
	}

	c.JSON(200, result)
}

func (ct *DatasetController) Read(c *gin.Context) {
	id := c.Param("id")
	skipParam := c.Param("skip")
	limitParam := c.Param("limit")

	skip, err := utility.IntFromString(skipParam)
	if err != nil {
		c.AbortWithStatusJSON(400, error.New400("Bad skip param", "bad-param"))
	}

	limit, err := utility.IntFromString(limitParam)
	if err != nil {
		c.AbortWithStatusJSON(400, error.New400("Bad limit param", "bad-param"))
	}

	result, serviceError := ct.Service.Read(id, skip, limit)
	if serviceError != nil {
		c.AbortWithStatusJSON(serviceError.Code, serviceError)
	}

	c.JSON(200, result)
}

func (ct *DatasetController) Prepare(c *gin.Context) {
	id := c.Param("id")
	_, err := ct.Service.ReadSpreadsheetAndSave(id)
	if err != nil {
		c.AbortWithStatusJSON(err.Code, err)
	}
}

func (ctr DatasetController) Delete(c *gin.Context) {
	id := c.Param("id")
	_, err := ctr.Service.ReadSpreadsheetAndSave(id)
	if err != nil {
		c.AbortWithStatusJSON(err.Code, err)
	}
}
