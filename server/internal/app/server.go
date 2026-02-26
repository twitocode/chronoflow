package app

import (
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httprate"

	"twitocode/chronoflow/internal/config"
	mw "twitocode/chronoflow/internal/middleware"
)

func NewServer(config *config.Config, services *Services) *chi.Mux {
	config.Log.Info("initializing chi server")

	r := chi.NewRouter()
	r.Use(middleware.Recoverer)
	r.Use(mw.LoggingMiddleware(config.Log))
  r.Use(middleware.CleanPath)
  r.Use(middleware.RedirectSlashes)
  r.Use(middleware.StripSlashes)
  r.Use(httprate.LimitByIP(100, 1*time.Minute))

	addRoutes(r, services)

	return r
}
