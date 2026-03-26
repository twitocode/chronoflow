package app

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"

	"twitocode/chronoflow/internal/config"
	mw "twitocode/chronoflow/internal/middleware"
)

func NewServer(config *config.Config, services *Services) *chi.Mux {
	config.Log.Info("initializing chi server")

	r := chi.NewRouter()

	// CORS middleware - MUST be first to handle preflight before any other middleware
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   config.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "Cookie", "X-Requested-With"},
		ExposedHeaders:   []string{"Link", "Set-Cookie"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.Recoverer)
	r.Use(mw.LoggingMiddleware(config.Log))
	// Skip JWT middleware for OPTIONS requests (handled by CORS)
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == http.MethodOptions {
				next.ServeHTTP(w, r)
				return
			}
			mw.JWTMiddleware(config.JWTSecret)(next).ServeHTTP(w, r)
		})
	})
	r.Use(middleware.CleanPath)
	r.Use(middleware.RedirectSlashes)
	r.Use(middleware.StripSlashes)
	r.Use(httprate.LimitByIP(100, 1*time.Minute))

	addRoutes(r, services)

	return r
}

