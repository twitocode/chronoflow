package service

import (
	"context"
	"fmt"
	"time"

	"twitocode/chronoflow/internal/db"

	finnhub "github.com/Finnhub-Stock-API/finnhub-go"
	"github.com/antihax/optional"
	"github.com/patrickmn/go-cache"

	"go.uber.org/zap"
	"resty.dev/v3"
)

type StockService struct {
	client  *resty.Client
	Logger  *zap.Logger
	apiKey  string
	queries *db.Queries
	cache   *cache.Cache

	finnhubClient *finnhub.DefaultApiService
}

type StockInfoAggregate struct {
	CompanyProfile       finnhub.CompanyProfile2       `json:"company_profile"`
	BasicFinancials      finnhub.BasicFinancials       `json:"basic_financials"`
	Quote                finnhub.Quote                 `json:"quote"`
	RecommendationTrends []finnhub.RecommendationTrend `json:"recommendation_trends"`
	CompanyEarnings      []finnhub.EarningResult       `json:"company_earnings"`
	EarningsCalendar     finnhub.EarningsCalendar      `json:"earnings_calendar"`
}

func NewStockService(logger *zap.Logger, apiKey string, queries *db.Queries) *StockService {
	client := resty.New()
	finnhubCfg := finnhub.NewConfiguration()
	finnhubCfg.AddDefaultHeader("X-Finnhub-Token", apiKey)
	finnhubClient := finnhub.NewAPIClient(finnhubCfg).DefaultApi

	return &StockService{
		client:        client,
		Logger:        logger,
		apiKey:        apiKey,
		queries:       queries,
		finnhubClient: finnhubClient,
		cache:         cache.New(10*time.Minute, 15*time.Minute),
	}
}

func (n *StockService) Get(ctx context.Context, symbol string) (*StockInfoAggregate, error) {
	var stockInfo StockInfoAggregate
	fromCache, found := n.cache.Get(symbol)

	if found {
		stockInfo = fromCache.(StockInfoAggregate)
	} else {
		quote, _, err := n.finnhubClient.Quote(ctx, symbol)
		if err != nil {
			n.Logger.Error("something happened with finnhub quote")
			return &StockInfoAggregate{}, fmt.Errorf("something happened with getting stock %w", err)
		}
		companyProfile, _, err := n.finnhubClient.CompanyProfile2(ctx, &finnhub.CompanyProfile2Opts{
			Symbol: optional.NewString(symbol),
		})
		if err != nil {
			n.Logger.Error("something happened with finnhub company profile")
			return &StockInfoAggregate{}, fmt.Errorf("something happened with getting stock %w", err)
		}

		basicFinancials, _, err := n.finnhubClient.CompanyBasicFinancials(ctx, symbol, "all")
		if err != nil {
			n.Logger.Error("something happened with finnhub financials")
			return &StockInfoAggregate{}, fmt.Errorf("something happened with getting stock %w", err)
		}

		recommendedTrends, _, err := n.finnhubClient.RecommendationTrends(ctx, symbol)
		if err != nil {
			n.Logger.Error("something happened with finnhub recommended trends")
			return &StockInfoAggregate{}, fmt.Errorf("something happened with getting stock %w", err)
		}
		companyEarnings, _, err := n.finnhubClient.CompanyEarnings(ctx, symbol, &finnhub.CompanyEarningsOpts{})
		if err != nil {
			n.Logger.Error("something happened with finnhub earnings")
			return &StockInfoAggregate{}, fmt.Errorf("something happened with getting stock %w", err)
		}
		earningsCalendar, _, err := n.finnhubClient.EarningsCalendar(ctx, &finnhub.EarningsCalendarOpts{
			Symbol: optional.NewString(symbol),
		})

		if err != nil {
			n.Logger.Error("something happened with finnhub recommended trends")
			return &StockInfoAggregate{}, fmt.Errorf("something happened with getting stock %w", err)
		}

		stockInfo = StockInfoAggregate{
			CompanyProfile:       companyProfile,
			Quote:                quote,
			BasicFinancials:      basicFinancials,
			RecommendationTrends: recommendedTrends,
			CompanyEarnings:      companyEarnings,
			EarningsCalendar:     earningsCalendar,
		}
	}
	return &stockInfo, nil
}
