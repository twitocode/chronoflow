package handlers

import (
	"github.com/gin-gonic/gin"

	"twitocode/chronoflow/internal/config"
	"twitocode/chronoflow/internal/logger"
	"twitocode/chronoflow/internal/service"
)

func HandleStockNews(config *config.Config, ns *service.NewsService) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger.Get().Info("handling OAuth2 callback")
		c.JSON(200, gin.H{
			"output": ns.Get(),
		})
	}
}
