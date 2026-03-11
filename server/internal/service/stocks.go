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
	"golang.org/x/sync/errgroup"
	"resty.dev/v3"
)

type StockService struct {
	client  *resty.Client
	Logger  *zap.Logger
	ApiKey  string
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
		ApiKey:        apiKey,
		queries:       queries,
		finnhubClient: finnhubClient,
		cache:         cache.New(10*time.Minute, 5*time.Minute),
	}
}

func (n *StockService) Get(ctx context.Context, symbol string) (*StockInfoAggregate, error) {
	var stockInfo StockInfoAggregate
	fromCache, found := n.cache.Get(symbol)

	if found {
		stockInfo = fromCache.(StockInfoAggregate)
	} else {
		g, errctx := errgroup.WithContext(ctx)

		var quote finnhub.Quote
		var companyProfile finnhub.CompanyProfile2
		var basicFinancials finnhub.BasicFinancials
		var recommendedTrends []finnhub.RecommendationTrend
		var companyEarnings []finnhub.EarningResult
		var earningsCalendar finnhub.EarningsCalendar

		g.Go(func() error {
			res, _, err := n.finnhubClient.Quote(errctx, symbol)
			if err != nil {
				return fmt.Errorf("quote: %w", err)
			}
			quote = res
			return nil
		})

		g.Go(func() error {
			res, _, err := n.finnhubClient.CompanyProfile2(errctx, &finnhub.CompanyProfile2Opts{
				Symbol: optional.NewString(symbol),
			})
			if err != nil {
				return fmt.Errorf("profile: %w", err)
			}
			companyProfile = res
			return nil
		})

		g.Go(func() error {
			res, _, err := n.finnhubClient.CompanyBasicFinancials(errctx, symbol, "all")
			if err != nil {
				return fmt.Errorf("financials: %w", err)
			}
			basicFinancials = res
			return nil
		})

		g.Go(func() error {
			res, _, err := n.finnhubClient.RecommendationTrends(errctx, symbol)
			if err != nil {
				return fmt.Errorf("recommendation trends: %w", err)
			}
			recommendedTrends = res
			return nil
		})

		g.Go(func() error {
			res, _, err := n.finnhubClient.CompanyEarnings(errctx, symbol, &finnhub.CompanyEarningsOpts{})
			if err != nil {
				return fmt.Errorf("earnings: %w", err)
			}
			companyEarnings = res
			return nil
		})

		g.Go(func() error {
			res, _, err := n.finnhubClient.EarningsCalendar(errctx, &finnhub.EarningsCalendarOpts{
				Symbol: optional.NewString(symbol),
			})
			if err != nil {
				return fmt.Errorf("earnings calendar: %w", err)
			}
			earningsCalendar = res
			return nil
		})

		if err := g.Wait(); err != nil {
			n.Logger.Error("finnhub fetch failed", zap.Error(err))
			return &StockInfoAggregate{}, fmt.Errorf("failed to get stock data: %w", err)
		}

		stockInfo = StockInfoAggregate{
			CompanyProfile:       companyProfile,
			Quote:                quote,
			BasicFinancials:      basicFinancials,
			RecommendationTrends: recommendedTrends,
			CompanyEarnings:      companyEarnings,
			EarningsCalendar:     earningsCalendar,
		}
		n.cache.Set(symbol, stockInfo, cache.DefaultExpiration)
	}
	return &stockInfo, nil
}
