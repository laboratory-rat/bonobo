package controller

import (
	"bonobo.madrat.studio/ms/domain/error"
	"bonobo.madrat.studio/ms/domain/model"
	"bonobo.madrat.studio/ms/infrastructure/service"
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

// List - Get stored metadata by query
func (ct *DatasetController) List(c *gin.Context) {
	startAfter := c.Query("start_after")
	limitParam := c.Param("limit")
	limit, err := utility.IntFromString(limitParam)
	if err != nil {
		c.AbortWithStatusJSON(400, error.New400("Bad skip param", "bad-param"))
	}

	result, er := ct.Service.List(startAfter, limit)
	if er != nil {
		c.AbortWithStatusJSON(er.Code, er)
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

// Approve - Confirm dataset and allow it to use
func (ct *DatasetController) Approve(c *gin.Context) {
	var m model.DatasetApproveModel
	id := c.Param("id")
	c.BindJSON(&m)
	err := ct.Service.Approve(id, m)
	if err != nil {
		c.AbortWithStatusJSON(err.Code, err)
	}

	c.Done()
}

// DeleteExpired - Not for external calls
// Will remove all temporary/expired datasets
func (ct *DatasetController) DeleteExpired() {

}

// Archive - Delete dataset and metadata
func (ct *DatasetController) Archive(c *gin.Context) {
	id := c.Param("id")
	err := ct.Service.Archive(id)
	if err != nil {
		c.AbortWithStatusJSON(err.Code, err)
	}

	c.Done()
}
