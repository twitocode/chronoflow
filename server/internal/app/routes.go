package app

import (
	"github.com/gin-gonic/gin"

	"twitocode/chronoflow/internal/config"
	"twitocode/chronoflow/internal/handlers"
	"twitocode/chronoflow/internal/service"
)

func addRoutes(router *gin.Engine, config *config.Config, newsService *service.NewsService) {
	router.POST("/oauth2/callback", handlers.HandleOAuth2(config))
	router.GET("/news", handlers.HandleStockNews(config, newsService))
}
