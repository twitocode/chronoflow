package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"go.uber.org/zap"

	"twitocode/chronoflow/internal/app"
	"twitocode/chronoflow/internal/config"
	"twitocode/chronoflow/internal/db"
	"twitocode/chronoflow/internal/pricestore"
	"twitocode/chronoflow/internal/ws"
)

func run(ctx context.Context, getenv func(string) string) error {
	if err := godotenv.Load(); err != nil {
		return fmt.Errorf("could not load .env: %w", err)
	}

	ctx, cancel := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer cancel()

	cfg := config.New(getenv)

	cfg.Log.Info("connecting to database")
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("unable to create connection pool: %w", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		return fmt.Errorf("unable to ping database: %w", err)
	}
	cfg.Log.Info("database connected (pool)")

	ps, err := pricestore.New(cfg.RedisURL, cfg.Log)
	if err != nil {
		return fmt.Errorf("unable to connect to redis: %w", err)
	}
	defer ps.Close()

	queries := db.New(pool)
	services := app.NewServices(cfg, queries, ps)
	chiRouter := app.NewServer(cfg, services)
	go services.Hub.Run()
	streamer := ws.NewFinnhubStreamer(services.Hub, services.Stock)
	go streamer.Connect()

	httpServer := &http.Server{
    //needed for tailscale -- something like that
		Addr: ":" + cfg.Port,
		// Addr:    net.JoinHostPort(cfg.Host, cfg.Port),
		Handler: chiRouter,
	}

	errCh := make(chan error, 1)
	go func() {
		cfg.Log.Info("listening on", zap.String("addr", httpServer.Addr))
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
	}()

	<-ctx.Done()
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		cfg.Log.Error("error shutting down http server", zap.Error(err))
	}

	return nil
}

func main() {
	ctx := context.Background()
	if err := run(ctx, os.Getenv); err != nil {
		log.Fatal(err)
	}
}
