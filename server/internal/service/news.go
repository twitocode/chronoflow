package service

import (
	"context"
	"fmt"
	"time"

	"twitocode/chronoflow/internal/db"

	"github.com/patrickmn/go-cache"

	"go.uber.org/zap"
	"resty.dev/v3"
)

type Meta struct {
	Found    uint  `json:"found"`
	Returned uint8 `json:"returned"`
	Limit    uint8 `json:"limit"`
	Page     uint8 `json:"page"`
}

type NewsData struct {
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Url         string     `json:"url"`
	ImageUrl    string     `json:"image_url"`
	PublishedAt string     `json:"published_at"`
	Source      string     `json:"source"`
	Similar     []NewsData `json:"similar"`
	Entities    []Entity   `json:"entities"`
}

type Entity struct {
	Symbol         string  `json:"symbol"`
	MatchScore     float32 `json:"match_score"`
	SentimentScore float32 `json:"sentiment_score"`
}

type NewsResponse struct {
	Meta Meta       `json:"meta"`
	Data []NewsData `json:"data"`
}

type NewsService struct {
	client  *resty.Client
	Logger  *zap.Logger
	apiKey  string
	queries *db.Queries
	cache   *cache.Cache
}

func NewNewsService(logger *zap.Logger, apiKey string, queries *db.Queries) *NewsService {
	client := resty.New()

	return &NewsService{
		client:  client,
		Logger:  logger,
		apiKey:  apiKey,
		queries: queries,
		cache:   cache.New(10*time.Minute, 15*time.Minute),
	}
}

func (n *NewsService) Get(ctx context.Context, symbol string) (*NewsResponse, error) {
	var newsData NewsResponse
	fromCache, found := n.cache.Get(symbol)

	if found {
		newsData = fromCache.(NewsResponse)
	} else {

		res, err := n.client.R().
			EnableTrace().
			SetResult(&newsData).
			SetQueryParams(map[string]string{
				"api_token":       n.apiKey,
				"symbols":         symbol,
				"language":        "en",
				"filter_entities": "true",
			}).
			Get("https://api.marketaux.com/v1/news/all")
		if err != nil {
			n.Logger.Error("failed to fetch news", zap.Error(err))
			return &NewsResponse{}, fmt.Errorf("failed to fetch news: %w", err)
		}

		n.Logger.Info("fetched news",
			zap.String("url", res.Request.URL),
			zap.Int("status", res.StatusCode()),
		)

		if res.IsError() {
			return &NewsResponse{}, fmt.Errorf("marketaux API returned error status: %d", res.StatusCode())
		}
		n.cache.Set(symbol, newsData, cache.DefaultExpiration)

	}

	return &newsData, nil
}
