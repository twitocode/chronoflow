'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '#/lib/api'
import { topCompanies } from '#/lib/data'
import { CreateAlertDialog } from './create-alert-dialog'
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

interface ApiResponse<T> {
  data: T
}

type StockAlertRow = {
  id: number
  symbol: string
  condition: string
  target_price: number
  created_at: string
}

function companyFromSymbol(symbol: string): string | undefined {
  return topCompanies.find((x) => x.symbol === symbol)?.name
}

export function StockDashboard() {
  const queryClient = useQueryClient()
  const [symbol, setSymbol] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastViewedSymbol') || 'AAPL'
    }
    return 'AAPL'
  })
  const [companyName, setCompanyName] = useState(() => {
    if (typeof window !== 'undefined') {
      const initialSymbol = localStorage.getItem('lastViewedSymbol') || 'AAPL'
      return companyFromSymbol(initialSymbol) || 'Apple'
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

  const [createAlertOpen, setCreateAlertOpen] = useState(false)

  const { data: alertsResponse } = useQuery<ApiResponse<StockAlertRow[]>>({
    queryKey: ['stock-alerts'],
    queryFn: () => apiGet('/api/v1/alerts'),
    staleTime: 30 * 1000,
  })

  const alertCountBySymbol = useMemo(() => {
    const r: Record<string, number> = {}
    for (const a of alertsResponse?.data ?? []) {
      r[a.symbol] = (r[a.symbol] ?? 0) + 1
    }
    return r
  }, [alertsResponse])

  const alertsForChart = useMemo(() => {
    if (!alertsResponse?.data) return []
    return alertsResponse.data
      .filter((a) => a.symbol === symbol)
      .map((a) => ({
        id: a.id,
        targetPrice: a.target_price,
        condition: a.condition,
      }))
  }, [alertsResponse, symbol])

  const createAlertMutation = useMutation<
    unknown,
    Error,
    { symbol: string; condition: string; targetPrice: number }
  >({
    mutationFn: (input: { symbol: string; condition: string; targetPrice: number }) =>
      apiPost('/api/v1/alerts', {
        symbol: input.symbol,
        condition: input.condition,
        target_price: input.targetPrice,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracked-stocks'] })
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] })
      setCreateAlertOpen(false)
    },
  })

  return (
    <div className="min-h-full w-full min-w-0 overflow-y-auto">
      <div className="mx-auto w-full min-w-0 max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <StockHeader
          symbol={symbol}
          companyName={companyName}
          alertCountBySymbol={alertCountBySymbol}
          onSymbolChange={handleSymbolChange}
          onOpenCreateAlert={() => setCreateAlertOpen(true)}
        />

        <CreateAlertDialog
          symbol={symbol}
          open={createAlertOpen}
          isPending={createAlertMutation.isPending}
          errorMessage={createAlertMutation.isError ? createAlertMutation.error.message : null}
          onOpenChange={setCreateAlertOpen}
          onSubmit={(input) => createAlertMutation.mutate(input)}
        />

        <StockChart symbol={symbol} alerts={alertsForChart} />

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
