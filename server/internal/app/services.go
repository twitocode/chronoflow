package app

import (
	"twitocode/chronoflow/internal/config"
	"twitocode/chronoflow/internal/db"
	"twitocode/chronoflow/internal/pricestore"
	"twitocode/chronoflow/internal/service"
	"twitocode/chronoflow/internal/ws"
)

type Services struct {
	News       *service.NewsService
	Auth       *service.AuthService
	Stock      *service.StockService
	Alerts     *service.AlertsService
	Analysis   *service.AnalysisService
	Hub        *ws.Hub
	PriceStore *pricestore.PriceStore
}

func NewServices(cfg *config.Config, queries *db.Queries, ps *pricestore.PriceStore) *Services {
	newsService := service.NewNewsService(cfg.Log, cfg.MarketAuxKey, queries)
	stockService := service.NewStockService(cfg.Log, cfg.FinnhubKey, queries)
	hub := ws.NewHub(ps)

	return &Services{
		News:       newsService,
		Auth:       service.NewAuthService(queries, cfg.Log, cfg.JWTSecret),
		Stock:      stockService,
		Alerts:     service.NewAlertsService(queries, cfg.Log),
		Analysis:   service.NewAnalysisService(newsService, stockService, cfg.Log, cfg.GeminiApiKey, queries),
		Hub:        hub,
		PriceStore: ps,
	}
}
