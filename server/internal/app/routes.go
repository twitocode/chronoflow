package app

import (
	"github.com/go-chi/chi/v5"

	"twitocode/chronoflow/internal/handlers"
)

func addRoutes(r *chi.Mux, services *Services) {
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/news", handlers.HandleStockNews(services.News))
		r.Get("/auth/{email}", handlers.HandleCheckEmail(services.Auth))
		r.Post("/auth/signup", handlers.HandleSignup(services.Auth))
	})
}
