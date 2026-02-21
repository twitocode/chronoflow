package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"go.uber.org/zap"

	"twitocode/chronoflow/internal/app"
	"twitocode/chronoflow/internal/config"
	"twitocode/chronoflow/internal/logger"
)

func run(
	ctx context.Context,
	getenv func(string) string,
) error {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Could not load .env")
		return err
	}

	ctx, cancel := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer cancel()

	logger.Init()
	log := logger.Sugar()
	defer logger.Close()

	config := config.New(getenv)
	ginEngine := app.NewServer(config)

	httpServer := &http.Server{
		Addr:    net.JoinHostPort(config.Host, config.Port),
		Handler: ginEngine,
	}

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		<-ctx.Done()
		shutdownCtx := context.Background()
		shutdownCtx, cancel := context.WithTimeout(shutdownCtx, 10*time.Second)
		defer cancel()
		if err := httpServer.Shutdown(shutdownCtx); err != nil {
			log.Error("error shutting down http server", zap.Error(err))
		}
	}()

	go func() {
		log.Info("listening on", zap.String("addr", httpServer.Addr))
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("error listening and serving", zap.Error(err))
		}
	}()

	wg.Wait()
	return nil
}

func main() {
	godotenv.Load()

	ctx := context.Background()
	if err := run(ctx, os.Getenv); err != nil {
		logger.Get().Error("fatal error", zap.Error(err))
		os.Exit(1)
	}
}
