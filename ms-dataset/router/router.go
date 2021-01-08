package router

import (
	"github.com/gin-contrib/cors"
	"time"

	"bonobo.madrat.studio/ms/controller"
	"bonobo.madrat.studio/ms/di"
	"github.com/gin-gonic/gin"
	gocron "github.com/go-co-op/gocron"
)

// Build - Prepare routes for app
func Build() *gin.Engine {
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowMethods:     []string{"GET", "POST", "OPTIONS", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "User-Agent", "Referrer", "Host", "Token"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		AllowAllOrigins:  true,
		MaxAge:           86400,
	}))

	cron := gocron.NewScheduler(time.UTC)
	container := di.BuildContainer()

	v1 := r.Group("/v1")
	{
		err := container.Invoke(func(c *controller.DatasetController) {
			dataset := v1.Group("/dataset")
			{
				dataset.GET("/create/spreadsheet/:id", c.CreateFromSpreadsheet)
				dataset.GET("/list/:limit", c.List)
				dataset.GET("/read/:id/:skip/:limit", c.Read)
				dataset.PUT("/approve/:id", c.Approve)
				dataset.DELETE("/archive/:id", c.Archive)
				//cron.Every(1).Minute().
				//	Do(fun () {c.DeleteExpired(nil)})
			}
		})

		if err != nil {
			panic(err)
		}
	}

	cron.StartAsync()

	// r.GET("/", func(c *gin.Context) {
	// 	c.JSON(http.StatusOK, gin.H{"data": "hello world"})
	// })

	return r
}
