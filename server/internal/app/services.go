package app

import (
	"twitocode/chronoflow/internal/config"
	"twitocode/chronoflow/internal/db"
	"twitocode/chronoflow/internal/service"
)

type Services struct {
	News  *service.NewsService
	Auth  *service.AuthService
	Stock *service.StockService
  Analysis *service.AnalysisService
}

func NewServices(cfg *config.Config, queries *db.Queries) *Services {
  newsService := service.NewNewsService(cfg.Log, cfg.MarketAuxKey, queries)
  stockService := service.NewStockService(cfg.Log, cfg.FinnhubKey, queries)

	return &Services{
		News:  newsService,
		Auth:  service.NewAuthService(queries, cfg.Log),
		Stock: stockService,
    Analysis: service.NewAnalysisService(newsService,stockService,cfg.Log, cfg.GeminiApiKey, queries),
	}
}
