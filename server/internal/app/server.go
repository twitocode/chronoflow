package app

import (
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"twitocode/chronoflow/internal/config"
	"twitocode/chronoflow/internal/service"
)

func NewServer(config *config.Config) *gin.Engine {
	config.Log.Info("initializing gin server")

	router := gin.Default()
	router.Use(LoggingMiddleware(config.Log))

	newsService := service.New(config.Log)
	addRoutes(router, config, newsService)

	return router
}

func LoggingMiddleware(log *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		log.Info("request",
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.Int("status", c.Writer.Status()),
		)
	}
}
