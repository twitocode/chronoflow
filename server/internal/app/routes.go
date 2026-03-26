package app

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"twitocode/chronoflow/internal/handlers"
	mw "twitocode/chronoflow/internal/middleware"
)

func addRoutes(r *chi.Mux, services *Services) {
	r.Get("/", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_, _ = w.Write([]byte(`{"ok":true,"service":"chronoflow-api"}`))
	})
	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_, _ = w.Write([]byte(`{"status":"healthy"}`))
	})

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/news", handlers.HandleStockNews(services.News))
		r.Get("/stocks/aggregate", handlers.HandleStockInfoAggregate(services.Stock, services.Hub))
		r.Get("/stocks/ws", handlers.HandleStockWS(services.Stock, services.Hub))
		r.Get("/stocks/history", handlers.HandleStockHistory(services.PriceStore))

		r.Group(func(r chi.Router) {
			r.Use(mw.RequireAuth)
			r.Get("/analysis", handlers.HandleStockAnalysis(services.Analysis))
			r.Get("/auth/me", handlers.HandleCurrentUser())
			r.Get("/stocks/tracked", handlers.HandleListTrackedStocks(services.Alerts))
			r.Post("/stocks/tracked", handlers.HandleAddTrackedStock(services.Alerts))
			r.Delete("/stocks/tracked/{symbol}", handlers.HandleDeleteTrackedStock(services.Alerts))
			r.Get("/alerts", handlers.HandleListStockAlerts(services.Alerts))
			r.Post("/alerts", handlers.HandleCreateStockAlert(services.Alerts))
			r.Delete("/alerts/{id}", handlers.HandleDeleteStockAlert(services.Alerts))
		})

		r.Get("/auth/{email}", handlers.HandleCheckEmail(services.Auth))
		r.Post("/auth/signup", handlers.HandleSignup(services.Auth))
		r.Post("/auth/login", handlers.HandleLogin(services.Auth))
		r.Post("/auth/logout", handlers.HandleLogout())
	})
}
