package config

import (
	"go.uber.org/zap"

	"twitocode/chronoflow/internal/logger"
)

type Config struct {
	Host string
	Port string
	Log  *zap.Logger
}

func New(getenv func(string) string) *Config {
	log := logger.Get()

	host := getenv("HOST")
	if host == "" {
		host = "localhost"
	}

	port := getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Info("config loaded", zap.String("host", host), zap.String("port", port))

	return &Config{
		Host: host,
		Port: port,
		Log:  log,
	}
}
