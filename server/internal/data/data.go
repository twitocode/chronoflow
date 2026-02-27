package data

var PopularStocks  = []string{
  "NVDA", "AAPL", "GOOG", "MSFT", "AMZN", "META", "TSLA", "AVGO", "BRK.A", "WMT",
}

// Gemini 3 Flash Preview Pricing per 1M tokens
const (
	Gemini3FlashInputPrice  = 0.50
	Gemini3FlashOutputPrice = 3.00
)

var SystemPrompt string = `
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

var UserPrompt string = `
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