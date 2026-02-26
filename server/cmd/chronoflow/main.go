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

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
	"go.uber.org/zap"

	"twitocode/chronoflow/internal/app"
	"twitocode/chronoflow/internal/config"
	"twitocode/chronoflow/internal/db"
)

func run(ctx context.Context, getenv func(string) string) error {
	if err := godotenv.Load(); err != nil {
		return fmt.Errorf("could not load .env: %w", err)
	}

	ctx, cancel := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer cancel()

	cfg := config.New(getenv)

	conn, err := pgx.Connect(ctx, cfg.DatabaseURL)
	cfg.Log.Info("connecting to database")
	if err != nil {
		return err
	}
	cfg.Log.Info("database connected")
	defer conn.Close(ctx)

	queries := db.New(conn)
	services := app.NewServices(cfg, queries)
	chiRouter := app.NewServer(cfg, services)

	httpServer := &http.Server{
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
