'use client'

import { apiGet } from '#/lib/api'
import { topCompanies } from '#/lib/data'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Bell, Search, Sparkles, TrendingUp, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/use-auth'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '#/components/ui/command'

export const Route = createFileRoute('/')({
  component: HomeRoute,
})

function HomeRoute() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate({ to: '/landing' })
      } else {
        // User is authenticated, stay on the trading dashboard
      }
    }
  }, [user, isLoading, navigate])

  // Show loading while checking auth
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <StockDashboard />
}

const periods = ['YTD', '3M', '1M', '1W', '1D']

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


function StockDashboard() {
  const companyFromSymbol = (symbol: string) =>
    topCompanies.find((x) => x.symbol === symbol)?.name

  const [activePeriod, setActivePeriod] = useState('1M')
  const [symbol, setSymbol] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastViewedSymbol') || 'AAPL'
    }
    return 'AAPL'
  })
  const [companyName, setCompanyName] = useState(() => {
    if (typeof window !== 'undefined') {
      const symbol = localStorage.getItem('lastViewedSymbol') || 'AAPL'
      return companyFromSymbol(symbol)
    }
    return 'Apple'
  })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('lastViewedSymbol', symbol)
  }, [symbol])

  useEffect(() => {
    const company = companyFromSymbol(symbol)
    setCompanyName(company || 'Company')
  }, [symbol])

  const handleSelectCompany = (symbol: string) => {
    setSymbol(symbol)
    setCompanyName(companyFromSymbol(symbol) || 'Company')
    setOpen(false)
  }

  // Keyboard shortcut for opening command menu
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Fetch news data (only if symbol is in the top 60 list)
  const {
    data: newsData,
    isLoading: newsLoading,
    error: newsError,
  } = useQuery<NewsResponse>({
    queryKey: ['news', symbol],
    queryFn: () => apiGet(`/api/v1/news?symbol=${symbol}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!companyFromSymbol(symbol), // Only fetch if symbol is in the list
  })

  // Fetch AI analysis (only if symbol is in the top 60 list)
  const {
    data: analysisData,
    isLoading: analysisLoading,
    error: analysisError,
  } = useQuery<AnalysisResponse>({
    queryKey: ['analysis', symbol],
    queryFn: () => apiGet(`/api/v1/analysis?symbol=${symbol}`),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!companyFromSymbol(symbol), // Only fetch if symbol is in the list
    retry: (failureCount, error) => {
      // Don't retry on 401 (unauthorized)
      if (error.message.includes('401')) return false
      return failureCount < 3
    },
  })

  // Mock chart data (you can replace with real stock data later)
  const chartData = [
    { x: 0, y: 50 },
    { x: 10, y: 55 },
    { x: 20, y: 70 },
    { x: 30, y: 65 },
    { x: 40, y: 45 },
    { x: 50, y: 30 },
    { x: 60, y: 25 },
    { x: 70, y: 55 },
    { x: 80, y: 85 },
    { x: 90, y: 70 },
    { x: 100, y: 60 },
    { x: 110, y: 55 },
  ]

  const pathD = chartData
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * 3} ${100 - p.y}`)
    .join(' ')

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const displayNews = newsData?.data?.slice(0, 3) || []

  const prediction =
    analysisData?.summary ||
    analysisData?.prediction ||
    (typeof analysisData === 'string'
      ? analysisData
      : 'Based on historical data and market trends, AAPL is expected to see moderate growth over the next quarter.')

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <TrendingUp className="size-4" />
              </button>
              <button className="p-2 rounded-full bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                <Bell className="size-4" />
              </button>
            </div>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {symbol}
              </h1>
              <p className="text-sm text-muted-foreground">{companyName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop: Show full search bar */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setOpen(true)}
                className="w-64 bg-card text-foreground pl-10 pr-4 py-2.5 rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm shadow-sm text-left flex items-center gap-2"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Search companies...</span>
              </button>
            </div>

            {/* Mobile: Show icon button */}
            <button
              onClick={() => setOpen(true)}
              className="md:hidden p-2.5 rounded-full bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors shadow-sm"
            >
              <Search className="size-4" />
            </button>

            <button className="p-2.5 rounded-full bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors shadow-sm">
              <User className="size-4" />
            </button>
          </div>

          <CommandDialog open={open} onOpenChange={setOpen}>
            <Command>
              <CommandInput placeholder="Search companies..." />
              <CommandList>
                <CommandEmpty>No companies found.</CommandEmpty>
                <CommandGroup heading="Top 60 Companies">
                  {topCompanies.map((company) => (
                    <CommandItem
                      key={company.symbol}
                      value={`${company.symbol} ${company.name}`}
                      onSelect={() => handleSelectCompany(company.symbol)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm">{company.symbol}</span>
                        <span className="text-muted-foreground text-xs">{company.name}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </CommandDialog>
        </header>

        {/* charrts replace later */}
        <div className="bg-card rounded-3xl p-6 border border-border shadow-sm mb-6">
          <svg viewBox="0 0 340 100" className="w-full h-48">
            <defs>
              <linearGradient
                id="lineGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="oklch(0.7 0.15 340)" />
                <stop offset="100%" stopColor="oklch(0.75 0.12 180)" />
              </linearGradient>
            </defs>
            <path
              d={pathD}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="flex gap-1.5 mt-4 justify-center">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activePeriod === p
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* AI Prediction */}
        <div className="bg-card rounded-3xl p-6 border border-border shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-full bg-accent/20">
              <Sparkles className="size-4 text-accent" />
            </div>
            <h2 className="font-semibold text-foreground">Prediction</h2>
            <span className="text-xs text-accent font-medium px-2 py-0.5 bg-accent/10 rounded-full">
              AI Generated
            </span>
          </div>
          {analysisLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-2 bg-linear-to-r from-primary/40 to-accent/40 rounded-full w-full" />
              <div className="h-2 bg-linear-to-r from-primary/30 to-accent/30 rounded-full w-4/5" />
              <div className="h-2 bg-gradient-to
              -r from-primary/20 to-accent/20 rounded-full w-3/5" />
            </div>
          ) : analysisError ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                {analysisError.message.includes('401')
                  ? 'Login to view AI predictions'
                  : 'Unable to load prediction'}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm mt-4 leading-relaxed">
              {prediction}
            </p>
          )}
        </div>

        {/* Recent News */}
        <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
          <h2 className="font-semibold text-foreground mb-4">Recent News</h2>
          {newsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-secondary/50 animate-pulse"
                >
                  <div className="h-4 bg-secondary w-3/4 rounded mb-2" />
                  <div className="h-3 bg-secondary w-1/4 rounded" />
                </div>
              ))}
            </div>
          ) : newsError ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                Unable to load news
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayNews.map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer block"
                >
                  <p className="text-sm text-foreground leading-snug">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {timeAgo(item.published_at)} • {item.source}
                  </p>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
