package app

import (
	"twitocode/chronoflow/internal/config"
	"twitocode/chronoflow/internal/db"
	"twitocode/chronoflow/internal/service"
)

type Services struct {
	News *service.NewsService
	Auth *service.AuthService
}

func NewServices(cfg *config.Config, queries *db.Queries) *Services {
	return &Services{
		News: service.NewNewsService(cfg.Log, cfg.MarketAuxKey, queries),
		Auth: service.NewAuthService(queries, cfg.Log),
	}
}
