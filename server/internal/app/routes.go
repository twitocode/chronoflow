package app

import (
	"github.com/go-chi/chi/v5"

	"twitocode/chronoflow/internal/handlers"
	mw "twitocode/chronoflow/internal/middleware"
)

func addRoutes(r *chi.Mux, services *Services) {
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/news", handlers.HandleStockNews(services.News))
		r.Get("/stocks/aggregate", handlers.HandleStockInfoAggregate(services.Stock, services.Hub))
		r.Get("/stocks/ws", handlers.HandleStockWS(services.Stock, services.Hub))
		
		r.Group(func(r chi.Router) {
			r.Use(mw.RequireAuth)
			r.Get("/analysis", handlers.HandleStockAnalysis(services.Analysis))
		})

		r.Get("/auth/{email}", handlers.HandleCheckEmail(services.Auth))
		r.Post("/auth/signup", handlers.HandleSignup(services.Auth))
		r.Post("/auth/login", handlers.HandleLogin(services.Auth))
	})
}
