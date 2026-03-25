// Top 60 companies by market cap with logo URLs
// Logos fetched from Logo.dev API
import { env } from '#/env'

export const topCompanies = [
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'GOOG', name: 'Alphabet (Google)' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'AVGO', name: 'Broadcom' },
  { symbol: 'META', name: 'Meta Platforms (Facebook)' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'BRK-B', name: 'Berkshire Hathaway' },
  { symbol: 'WMT', name: 'Walmart' },
  { symbol: 'LLY', name: 'Eli Lilly' },
  { symbol: 'JPM', name: 'JPMorgan Chase' },
  { symbol: 'XOM', name: 'Exxon Mobil' },
  { symbol: 'V', name: 'Visa' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'MU', name: 'Micron Technology' },
  { symbol: 'MA', name: 'Mastercard' },
  { symbol: 'COST', name: 'Costco' },
  { symbol: 'ORCL', name: 'Oracle' },
  { symbol: 'CVX', name: 'Chevron' },
  { symbol: 'NFLX', name: 'Netflix' },
  { symbol: 'PLTR', name: 'Palantir' },
  { symbol: 'ABBV', name: 'AbbVie' },
  { symbol: 'BAC', name: 'Bank of America' },
  { symbol: 'CAT', name: 'Caterpillar' },
  { symbol: 'AMD', name: 'AMD' },
  { symbol: 'PG', name: 'Procter & Gamble' },
  { symbol: 'HD', name: 'Home Depot' },
  { symbol: 'KO', name: 'Coca-Cola' },
  { symbol: 'CSCO', name: 'Cisco' },
  { symbol: 'GE', name: 'General Electric' },
  { symbol: 'AMAT', name: 'Applied Materials' },
  { symbol: 'MRK', name: 'Merck' },
  { symbol: 'MS', name: 'Morgan Stanley' },
  { symbol: 'RTX', name: 'RTX' },
  { symbol: 'GS', name: 'Goldman Sachs' },
  { symbol: 'UNH', name: 'UnitedHealth' },
  { symbol: 'GEV', name: 'GE Vernova' },
  { symbol: 'WFC', name: 'Wells Fargo' },
  { symbol: 'TMUS', name: 'T-Mobile US' },
  { symbol: 'IBM', name: 'IBM' },
  { symbol: 'INTC', name: 'Intel' },
  { symbol: 'MCD', name: 'McDonald' },
  { symbol: 'VZ', name: 'Verizon' },
  { symbol: 'AXP', name: 'American Express' },
  { symbol: 'PEP', name: 'Pepsico' },
  { symbol: 'T', name: 'AT&T' },
  { symbol: 'TXN', name: 'Texas Instruments' },
  { symbol: 'CRM', name: 'Salesforce' },
  { symbol: 'DIS', name: 'Walt Disney' },
]

export function getLogoUrl(symbol: string, size = 64) {
  const apiKey = env.VITE_LOGO_DEV_KEY
  if (!apiKey) {
    return `https://ui-avatars.com/api/?name=${symbol}&background=random&size=${size}`
  }
  return `https://img.logo.dev/ticker/${symbol}?token=${apiKey}&size=${size}`
}
