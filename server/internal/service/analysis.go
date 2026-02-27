package service

import (
	"context"
	"crypto/sha256"
	"fmt"
	"slices"
	"strings"
	"time"
	"twitocode/chronoflow/internal/data"
	"twitocode/chronoflow/internal/db"

	"github.com/patrickmn/go-cache"
	"github.com/pkoukk/tiktoken-go"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
	"google.golang.org/genai"
)


type AnalysisService struct {
	ns      *NewsService
	ss      *StockService
	Logger  *zap.Logger
	queries *db.Queries
	cache   *cache.Cache
	gemini  *genai.Client
}

func NewAnalysisService(ns *NewsService, ss *StockService, logger *zap.Logger, apiKey string, queries *db.Queries) *AnalysisService {
	gemini, err := genai.NewClient(context.Background(), &genai.ClientConfig{
		APIKey:  apiKey,
		Backend: genai.BackendGeminiAPI,
	})

	if err != nil {
		panic(err)
	}
	return &AnalysisService{
		ns:      ns,
		ss:      ss,
		Logger:  logger,
		queries: queries,
		cache:   cache.New(24*time.Hour, 1 *time.Hour),
		gemini:  gemini,
	}
}

func (as *AnalysisService) Analyze(ctx context.Context, symbol string) (string, error) {
	g, err_ctx := errgroup.WithContext(ctx)

	var stockInfo *StockInfoAggregate
	var news *NewsResponse

	g.Go(func() error { 
		start := time.Now()
		data, err := as.ss.Get(err_ctx, symbol)
		if err != nil {
			return err
		}
		stockInfo = data
		as.Logger.Info("retrieved stock info", zap.Duration("duration", time.Since(start)))
		return nil
	})

	g.Go(func() error {
		start := time.Now()
		data, err := as.ns.Get(err_ctx, symbol)
		if err != nil {
			return err
		}
		news = data
		as.Logger.Info("retrieved news data", zap.Duration("duration", time.Since(start)))
		return nil
	})

	if err := g.Wait(); err != nil {
		as.Logger.Error("Either the stock or news goroutine failed for some reason", zap.Error(err))
		return "", fmt.Errorf("something happened with the stock prediction %w", err)
	}

	res, err := as.Predict(ctx, symbol, stockInfo, &(news).Data)
	if err != nil {
		return "", err
	}
	return res, nil
}

func (as *AnalysisService) BuildPrompt(stockInfo *StockInfoAggregate, news *[]NewsData) string {
	m := stockInfo.BasicFinancials.Metric
		trends := "No recent analyst data"

	if len(stockInfo.RecommendationTrends) > 0 {
		t := stockInfo.RecommendationTrends[0]
		trends = fmt.Sprintf("Buy: %d, Strong Buy: %d, Hold: %d, Sell: %d", t.Buy, t.StrongBuy, t.Hold, t.Sell)
	}

	earnings := "No recent earnings data"
	if len(stockInfo.CompanyEarnings) > 0 {
		e := stockInfo.CompanyEarnings[0]
		earnings = fmt.Sprintf("Last: Actual %.2f vs Est %.2f (Period: %s)", e.Actual, e.Estimate, e.Period)
	}

	return fmt.Sprintf(`
    ### MARKET SNAPSHOT: %s
    PRICE: %.2f | 52W HIGH: %.2f | 52W LOW: %.2f
    PE: %.2f | PEG: %.2f | BETA: %.2f
    REV GROWTH: %.2f%% | EPS GROWTH: %.2f%%
    ANALYST TRENDS: %s
    EARNINGS: %s

    ### NEWS TIMELINE:
    %s`,
		stockInfo.CompanyProfile.Ticker,
		stockInfo.Quote.C, m["52WeekHigh"], m["52WeekLow"],
		m["peTTM"], m["pegTTM"], m["beta"],
		m["revenueGrowthTTMYoy"], m["epsGrowthTTMYoy"],
		trends, earnings,
		as.formatNewsForAI(news))
}

func (as *AnalysisService) formatNewsForAI(news *[]NewsData) string {
	var res string
	slice := slices.Values(*news)
	for x := range slice {
		res = strings.Join([]string{fmt.Sprintf("[%s] (Sentiment: %.3f) Title: %s", x.PublishedAt, x.Entities[0].SentimentScore, x.Title), res}, "\n")
	}
	return res
}

func (as *AnalysisService) Predict(ctx context.Context, symbol string, stockInfo *StockInfoAggregate, news *[]NewsData) (string, error) {
  as.Logger.Info("starting ai prediction")
  promptData := as.BuildPrompt(stockInfo, news)
  hash := sha256.Sum256([]byte(promptData))
  cacheKey := fmt.Sprintf("%s:%x", symbol, hash)

	if x, found := as.cache.Get(cacheKey); found {
		return x.(string), nil
	}

	config := &genai.GenerateContentConfig{
		SystemInstruction: genai.NewContentFromText(data.SystemPrompt, genai.RoleUser),

	}
	fullPrompt := fmt.Sprintf("%s\n%s", data.UserPrompt, promptData)

	inputTokens, _ := as.EstimateTokens(fullPrompt)
	inputCost := (float64(inputTokens) / 1_000_000.0) * data.Gemini3FlashInputPrice
	as.Logger.Debug("Gemini Input Stats",
		zap.Int("tokens", inputTokens),
		zap.Float64("cost_usd", inputCost),
	)

	start := time.Now()
	result, err := as.gemini.Models.GenerateContent(
		ctx,
		"gemini-3-flash-preview",
		genai.Text(fullPrompt),
		config,
	)
	duration := time.Since(start)

	if err != nil {
		as.Logger.Error("error with gemini response", zap.Error(err))
		return "", err
	}

	prediction := as.sanitizeJSON(result.Text())
	as.cache.Set(cacheKey, prediction, cache.DefaultExpiration)

	outputTokens, _ := as.EstimateTokens(prediction)
	outputCost := (float64(outputTokens) / 1_000_000.0) * data.Gemini3FlashOutputPrice
	as.Logger.Debug("Gemini Output Stats",
		zap.Int("tokens", outputTokens),
		zap.Float64("cost_usd", outputCost),
		zap.Float64("total_request_cost_usd", inputCost+outputCost),
		zap.Duration("duration", duration),
	)

	return prediction, nil
}

func (as *AnalysisService) sanitizeJSON(s string) string {
	s = strings.TrimSpace(s)
	if strings.HasPrefix(s, "```json") {
		s = strings.TrimPrefix(s, "```json")
		s = strings.TrimSuffix(s, "```")
	} else if strings.HasPrefix(s, "```") {
		s = strings.TrimPrefix(s, "```")
		s = strings.TrimSuffix(s, "```")
	}
	return strings.TrimSpace(s)
}

func (as *AnalysisService) EstimateTokens(text string) (int, error) {
	tkm, err := tiktoken.GetEncoding("cl100k_base")
	if err != nil {
		return 0, fmt.Errorf("getEncoding: %v", err)
	}

	tokenIds := tkm.Encode(text, nil, nil)
	return len(tokenIds), nil
}
