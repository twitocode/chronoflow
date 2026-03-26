package config

import (
	"os"
	"strings"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type Config struct {
	Host           string
	Port           string
	MarketAuxKey   string
	FinnhubKey     string
	Log            *zap.Logger
	DatabaseURL    string
	GeminiApiKey   string
	JWTSecret      string
	AllowedOrigins []string
	RedisURL       string
}

func New(getenv func(string) string) *Config {
	log := initLogger()

	host := getenv("HOST")
	if host == "" {
		host = "localhost"
	}

	port := getenv("PORT")
	if port == "" {
		port = "8000"
	}

	marketAuxKey := getenv("MARKET_AUX_KEY")
	finnhubKey := getenv("FINNHUB_KEY")
	databaseUrl := getenv("DATABASE_URL")
	geminiKey := getenv("GEMINI_API_KEY")
	jwtSecret := getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "secret-key-for-dev"
	}
	allowedOrigins := parseAllowedOrigins(getenv("ALLOWED_ORIGINS"))

	redisURL := getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}

	log.Info("config loaded", zap.String("host", host), zap.String("port", port))

	return &Config{
		Host:           host,
		Port:           port,
		MarketAuxKey:   marketAuxKey,
		Log:            log,
		DatabaseURL:    databaseUrl,
		FinnhubKey:     finnhubKey,
		GeminiApiKey:   geminiKey,
		JWTSecret:      jwtSecret,
		AllowedOrigins: allowedOrigins,
		RedisURL:       redisURL,
	}
}

func parseAllowedOrigins(value string) []string {
	if value == "" {
		return []string{"http://localhost:3000", "http://127.0.0.1:3000"}
	}

	parts := strings.Split(value, ",")
	origins := make([]string, 0, len(parts))
	for _, part := range parts {
		origin := strings.TrimSpace(part)
		if origin != "" {
			origins = append(origins, origin)
		}
	}

	if len(origins) == 0 {
		return []string{"http://localhost:3000", "http://127.0.0.1:3000"}
	}

	return origins
}

func initLogger() *zap.Logger {
	if os.Getenv("APP_ENV") == "development" {
		config := zap.NewDevelopmentConfig()
		config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
		return zap.Must(config.Build())
	}
	return zap.Must(zap.NewProduction())
}
