package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
	"twitocode/chronoflow/internal/db"

	"github.com/patrickmn/go-cache"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
	"google.golang.org/genai"
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
    ### RECENT PRICE METRICS
    Current Price: {{.CurrentPrice}}
    52-Week High: {{.High52W}}
    52-Week Low: {{.Low52W}}
    10-Day Avg Volume: {{.AvgVolume}}
    Beta (Volatility): {{.Beta}}

    ### NEWS TIMELINE (Last {{.Days}} Days)
    {{.NewsTimeline}}

    ### YOUR TASK
    Perform a deep analysis of how the news headlines correlate with the price metrics. Look for "catalysts"
    (earnings, lawsuits, product launches) and determine if the market has already "priced in" this news or if a
    further move is likely.

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
		//TODO: dont panic
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

func (as *AnalysisService) Predict(ctx context.Context, symbol string, stockInfo *StockInfoAggregate, news *[]NewsData) (string, error) {
	//TODO: based on timespan
	if x, found := as.cache.Get(symbol); found {
		return x.(string), nil
	}

	stockBytes, err := json.Marshal(&stockInfo)
	if err != nil {
		panic(fmt.Errorf("Stock Data is malformed %w", err))
	}

	newsBytes, err := json.Marshal(&news)
	if err != nil {
		panic(fmt.Errorf("Stock Data is malformed %w", err))
	}

	stockJsonString := string(stockBytes)
	newsJsonString := string(newsBytes)

	config := &genai.GenerateContentConfig{
		SystemInstruction: genai.NewContentFromText(systemPrompt, genai.RoleUser),
	}
	result, err := as.gemini.Models.GenerateContent(
		ctx,
		"gemini-3-flash-preview",
		genai.Text(fmt.Sprintf(`
    %s\n
    STOCK SYMBOL: %s\n
    STOCK DATA: %s\n
    NEWS DATA: %s\n
    `, userPrompt, symbol, stockJsonString, newsJsonString)),
		config,
	)

	if err != nil {
		as.Logger.Error("error with gemini response", zap.Error(err))
		return "", err
	}

	prediction := result.Text()
	as.cache.Set(symbol, prediction, cache.DefaultExpiration)
	return prediction, nil
}
