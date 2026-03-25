'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '#/lib/api'
import { topCompanies } from '#/lib/data'
import { StockHeader } from './stock-header'
import { StockChart } from './stock-chart'
import { AIPrediction } from './ai-prediction'
import { NewsList } from './news-list'

interface NewsItem {
  title: string
  description: string
  url: string
  image_url: string
  published_at: string
  source: string
}

interface NewsResponse {
  meta: {
    found: number
    returned: number
  }
  data: NewsItem[]
}

interface AnalysisResponse {
  prediction?: string
  summary?: string
  sentiment?: string
  confidence?: number
  [key: string]: any
}

function companyFromSymbol(symbol: string): string | undefined {
  return topCompanies.find((x) => x.symbol === symbol)?.name
}

export function StockDashboard() {
  const [symbol, setSymbol] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastViewedSymbol') || 'AAPL'
    }
    return 'AAPL'
  })
  const [companyName, setCompanyName] = useState(() => {
    if (typeof window !== 'undefined') {
      const symbol = localStorage.getItem('lastViewedSymbol') || 'AAPL'
      return companyFromSymbol(symbol) || "Apple"
    }
    return 'Apple'
  })

  useEffect(() => {
    localStorage.setItem('lastViewedSymbol', symbol)
  }, [symbol])

  useEffect(() => {
    const company = companyFromSymbol(symbol)
    setCompanyName(company || 'Company')
  }, [symbol])

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol)
    const company = companyFromSymbol(newSymbol)
    setCompanyName(company || 'Company')
  }

  const {
    data: newsData,
    isLoading: newsLoading,
    error: newsError,
  } = useQuery<NewsResponse>({
    queryKey: ['news', symbol],
    queryFn: () => apiGet(`/api/v1/news?symbol=${symbol}`),
    staleTime: 5 * 60 * 1000,
    enabled: !!companyFromSymbol(symbol),
  })

  const {
    data: analysisData,
    isLoading: analysisLoading,
    error: analysisError,
  } = useQuery<any>({
    queryKey: ['analysis', symbol],
    queryFn: () => apiGet(`/api/v1/analysis?symbol=${symbol}`),
    staleTime: 60 * 60 * 1000,
    enabled: !!companyFromSymbol(symbol),
    retry: (failureCount, error) => {
      if (error.message.includes('401')) return false
      return failureCount < 3
    },
  })

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <StockHeader
          symbol={symbol}
          companyName={companyName}
          onSymbolChange={handleSymbolChange}
        />

        <StockChart symbol={symbol}/>

        <AIPrediction
          prediction={analysisData}
          isLoading={analysisLoading}
          isError={!!analysisError}
        />

        <NewsList
          news={newsData?.data || []}
          isLoading={newsLoading}
          isError={!!newsError}
        />
      </div>
    </div>
  )
}
