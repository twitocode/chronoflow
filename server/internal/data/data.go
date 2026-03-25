package data

var PopularStocks = []string{
	"NVDA", "AAPL", "GOOG", "MSFT", "AMZN", "META", "TSLA", "AVGO", "BRK.A", "WMT",
}

// Gemini 3 Flash Preview Pricing per 1M tokens
const (
	Gemini3FlashInputPrice    = 0.50
	Gemini3FlashOutputPrice   = 3.00
	Gemini3_1FlashInputPrice  = 0.25
	Gemini3_1FlashOutputPrice = 1.50
)

var SystemPrompt string = `
  Act as a friendly, patient financial mentor for someone who has never bought a stock before.
  Explain this news about [SYMBOL] without using Wall Street jargon. If you must use a technical
  term (like 'Earnings'), define it simply in parentheses. Your goal is to make the user feel
  confident, not confused. Keep it very short.

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
      "simple_headline": "Good news: The company is saving money on shipping.",
      "vibe": "Positive / Steady / Concerning",
      "explanation": "By using new software, they are spending less to move products. This means they keep more profit for every sale.",
      "beginner_tip": "When a company cuts costs without firing people, it's usually a sign of a well-run business.",
      "action_step": "Look at the 'Price' chart above—if the line keeps going up, people are happy about this news."
    }
`
