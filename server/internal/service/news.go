package service

import (
	"fmt"
	"os"

	"go.uber.org/zap"
	"resty.dev/v3"
)

type NewsService struct {
	client *resty.Client
	logger *zap.Logger
}

func New(logger *zap.Logger) *NewsService {
	client := resty.New()

	//might cause errors
	defer client.Close()

	return &NewsService{
		client: client,
		logger: logger,
	}
}

func (n *NewsService) Get() string {
	res, err := n.client.R().
		EnableTrace().
		SetQueryParams(map[string]string{
			"api_token":       os.Getenv("MARKET_AUX_KEY"),
			"symbols":         "TSLA",
			"language":        "en",
			"filter_entities": "true",
		}).
		Get("https://api.marketaux.com/v1/news/all")
	if err != nil {
		fmt.Printf("Something went wrong %s", err.Error())
		return ""
	}

	n.logger.Sugar().Infof("URL: %s\n", res.Request.URL)
	n.logger.Sugar().Infof("Status: %d\n", res.StatusCode())
	body := res.String()
	return body
}
