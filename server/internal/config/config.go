package config

import (
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type Config struct {
	Host         string
	Port         string
	MarketAuxKey string
	Log          *zap.Logger
	DatabaseURL  string
}

func New(getenv func(string) string) *Config {
	log := initLogger()

	host := getenv("HOST")
	if host == "" {
		host = "localhost"
	}

	port := getenv("PORT")
	if port == "" {
		port = "8080"
	}

	marketAuxKey := getenv("MARKET_AUX_KEY")
	databaseUrl := getenv("DATABASE_URL")
	log.Info("config loaded", zap.String("host", host), zap.String("port", port))

	return &Config{
		Host:         host,
		Port:         port,
		MarketAuxKey: marketAuxKey,
		Log:          log,
		DatabaseURL:  databaseUrl,
	}
}

func initLogger() *zap.Logger {
	if os.Getenv("APP_ENV") == "development" {
		config := zap.NewDevelopmentConfig()
		config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
		return zap.Must(config.Build())
	}
	return zap.Must(zap.NewProduction())
}
