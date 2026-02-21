package handlers

import (
	"github.com/gin-gonic/gin"

	"twitocode/chronoflow/internal/config"
	"twitocode/chronoflow/internal/logger"
)

func HandleOAuth2(config *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger.Get().Info("handling OAuth2 callback")
		c.JSON(200, gin.H{
			"status": "ok",
		})
	}
}