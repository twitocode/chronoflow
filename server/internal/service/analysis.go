package service

import (
	"context"
	"fmt"
	"slices"
	"strings"
	"time"
	"twitocode/chronoflow/internal/db"

	"github.com/patrickmn/go-cache"
	"github.com/pkoukk/tiktoken-go"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
	"google.golang.org/genai"
)

// Gemini 3 Flash Preview Pricing per 1M tokens
const (
	Gemini3FlashInputPrice  = 0.50
	Gemini3FlashOutputPrice = 3.00
)

var systemPrompt string = `
  Act as a Senior Quantitative Financial Analyst and Data Scientist. Your goal is to perform cross-correlational
  analysis between news sentiment and market price action.
  CRITICAL CONSTRAINTS:
    1. Provide data-driven reasoning based ONLY on the provided news and metrics.
    2. If the data is contradictory, acknowledge the volatility.
    3. ALWAYS return your response in the specified JSON format.
    4. Do NOT include any conversational text (e.g., "Here is your analysis...") before or after the JSON.
    5. This is for informational purposes; do not provide a "Financial Advice" disclaimer as it is already handled
      by the UI.
`

var userPrompt string = `
    ### YOUR TASK
    Perform a deep analysis of how the news headlines correlate with the provided market metrics. 
    Look for "catalysts" (earnings surprises, technical trends, sentiment shifts) and determine if the 
    market has already "priced in" this news or if a further move is likely.

    ### OUTPUT FORMAT (JSON ONLY)
    {
      "prediction": "BULLISH | BEARISH | NEUTRAL",
      "confidence_score": 0.0, // 0.0 to 1.0
      "short_term_outlook": "String describing the next 5-10 days",
      "key_catalysts": ["Point 1", "Point 2"],
      "sentiment_analysis": "Summary of news tone",
      "risk_factors": ["Factor 1", "Factor 2"]
    }
`

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
		cache:   cache.New(10*time.Minute, 15*time.Minute),
		gemini:  gemini,
	}
}

func (as *AnalysisService) Analyze(ctx context.Context, symbol string) (string, error) {
	g, errctx := errgroup.WithContext(ctx)

	var stockInfo *StockInfoAggregate
	var news *NewsResponse

	g.Go(func() error {
		data, err := as.ss.Get(errctx, symbol)
		if err != nil {
			return err
		}
		stockInfo = data
		return nil
	})

	g.Go(func() error {
		data, err := as.ns.Get(errctx, symbol)
		if err != nil {
			return err
		}
		news = data
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
	if x, found := as.cache.Get(symbol); found {
		return x.(string), nil
	}

	config := &genai.GenerateContentConfig{
		SystemInstruction: genai.NewContentFromText(systemPrompt, genai.RoleUser),
	}

	promptText := as.BuildPrompt(stockInfo, news)
	fullPrompt := fmt.Sprintf("%s\n%s", userPrompt, promptText)

	inputTokens, _ := as.EstimateTokens(fullPrompt)
	inputCost := (float64(inputTokens) / 1_000_000.0) * Gemini3FlashInputPrice
	as.Logger.Debug("Gemini Input Stats",
		zap.Int("tokens", inputTokens),
		zap.Float64("cost_usd", inputCost),
	)

	result, err := as.gemini.Models.GenerateContent(
		ctx,
		"gemini-3-flash-preview",
		genai.Text(fullPrompt),
		config,
	)

	if err != nil {
		as.Logger.Error("error with gemini response", zap.Error(err))
		return "", err
	}

	prediction := result.Text()
	as.cache.Set(symbol, prediction, cache.DefaultExpiration)

	outputTokens, _ := as.EstimateTokens(prediction)
	outputCost := (float64(outputTokens) / 1_000_000.0) * Gemini3FlashOutputPrice
	as.Logger.Debug("Gemini Output Stats",
		zap.Int("tokens", outputTokens),
		zap.Float64("cost_usd", outputCost),
		zap.Float64("total_request_cost_usd", inputCost+outputCost),
	)

	return prediction, nil
}

func (as *AnalysisService) EstimateTokens(text string) (int, error) {
	tkm, err := tiktoken.GetEncoding("cl100k_base")
	if err != nil {
		return 0, fmt.Errorf("getEncoding: %v", err)
	}

	tokenIds := tkm.Encode(text, nil, nil)
	return len(tokenIds), nil
}
