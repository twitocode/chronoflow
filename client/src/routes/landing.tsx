'use client'

import { Button } from '#/components/ui/button'
import { useAuth } from '#/hooks/use-auth'
import { apiGet, apiWebSocketUrl } from '#/lib/api'
import { cn } from '#/lib/utils'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Bell, Github, Newspaper, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import AppScreenshotImage from '../assets/app-screenshot.png'

export const Route = createFileRoute('/landing')({
  component: LandingPage,
})

type QuotePoint = { time: number; value: number }

/** Live last price + session % change from history + WS (same pipeline as the stock chart). */
function useLiveSymbolQuote(symbol: string) {
  const [data, setData] = useState<QuotePoint[]>([])
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let cancelled = false
    setData([])

    async function init() {
      try {
        const res = await apiGet<{ data: { symbol: string; price: number; time: number }[] }>(
          `/api/v1/stocks/history?symbol=${encodeURIComponent(symbol)}`,
        )
        if (cancelled) return
        if (res.data?.length) {
          const initial: QuotePoint[] = []
          for (const t of res.data) {
            const sec = Math.floor(t.time / 1000)
            const value = t.price
            const last = initial[initial.length - 1]
            if (!last || sec > last.time) {
              initial.push({ time: sec, value })
            } else if (sec === last.time) {
              initial[initial.length - 1] = { time: sec, value }
            }
          }
          setData(initial)
        }
      } catch {
        // history unavailable, but live ticks may still populate
      }

      if (cancelled) return

      const socket = new WebSocket(
        apiWebSocketUrl(`/api/v1/stocks/ws?symbol=${encodeURIComponent(symbol)}`),
      )
      socketRef.current = socket

      socket.addEventListener('message', (event) => {
        const trade = JSON.parse(event.data) as { time: number; price: number }
        setData((old) => {
          const t = Math.floor(trade.time / 1000)
          const value = trade.price
          if (old.length === 0) return [{ time: t, value }]
          const last = old[old.length - 1]
          if (t === last.time) {
            return [...old.slice(0, -1), { time: t, value }]
          }
          if (t < last.time) return old
          return [...old, { time: t, value }]
        })
      })
    }

    init()

    return () => {
      cancelled = true
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [symbol])

  return useMemo(() => {
    if (data.length === 0) {
      return {
        lastPrice: null as number | null,
        percentChange: null as number | null,
        isPositive: true,
      }
    }
    const last = data[data.length - 1].value
    const first = data[0].value
    const change = last - first
    return {
      lastPrice: last,
      percentChange: (change / first) * 100,
      isPositive: change >= 0,
    }
  }, [data])
}

function LandingPage() {
  const { user } = useAuth()
  const msft = useLiveSymbolQuote('MSFT')

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,oklch(0.65_0.12_200/0.2),transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_20%,oklch(0.6_0.08_280/0.12),transparent)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,oklch(0.45_0.14_200/0.45),transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_20%,oklch(0.35_0.1_280/0.25),transparent)]"
        aria-hidden
      />
      <header className="flex items-center justify-between border-b border-border/60 bg-background/70 px-4 py-4 backdrop-blur-md sm:px-8">
        <span className="font-display text-lg font-semibold tracking-tight">
          Chrono<span className="text-primary">Flow</span>
        </span>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <Link to="/">
              <Button size="sm" className="shadow-sm">
                Go to app
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="shadow-sm">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-16 lg:py-0">
          <h1 className="font-display mb-5 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-foreground lg:text-5xl xl:text-6xl">
            Read the market in real time
          </h1>

          <p className="mb-10 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
            Live prices, charts, and alerts in one calm workspace. Gain insights
            on future stock potential.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <Link to="/">
                <Button size="lg" className="shadow-md">
                  Open dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/register">
                <Button size="lg" className="shadow-md">
                  Create account
                </Button>
              </Link>
            )}
            <Link to="/login">
              <Button
                variant="outline"
                size="lg"
                className="border-border/80 bg-background/50"
              >
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center p-6 lg:p-12">
          <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,220px)_minmax(0,320px)_minmax(0,220px)] lg:grid-rows-2">
            <div className="order-2 flex h-full flex-col gap-3 rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm sm:min-h-30 lg:order-0">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
                <TrendingUp className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Live Prices
                </h3>
                <p className="text-sm text-muted-foreground">
                  Real-time market data with millisecond updates
                </p>
              </div>
              <div className="sm:mt-auto pt-3 border-t border-border">
                <div className="flex justify-between gap-3 text-sm items-center">
                  <div>
                    <span className="text-muted-foreground flex flex-col">
                      <span>MSFT</span>
                      <span className="text-emerald-400 animate-pulse">
                        Live
                      </span>
                    </span>
                  </div>
                  <div className="min-w-0 text-right">
                    <div className="font-mono-nums font-semibold text-foreground">
                      {msft.lastPrice != null
                        ? `$${msft.lastPrice.toFixed(2)}`
                        : 'N/A'}
                    </div>
                    {msft.percentChange != null && (
                      <div
                        className={cn(
                          'mt-0.5 flex items-center justify-end gap-0.5 text-xs font-medium',
                          msft.isPositive ? 'text-emerald-400' : 'text-red-400',
                        )}
                      >
                        {msft.isPositive ? (
                          <TrendingUp className="size-3 shrink-0" aria-hidden />
                        ) : (
                          <TrendingDown
                            className="size-3 shrink-0"
                            aria-hidden
                          />
                        )}
                        <span>
                          {msft.isPositive ? '+' : ''}
                          {msft.percentChange.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 mx-auto w-full max-w-sm overflow-hidden rounded-[28px] border border-border/50 bg-linear-to-b from-card to-muted/40 p-3 shadow-xl sm:col-span-2 lg:order-0 lg:col-span-1 lg:row-span-2 lg:max-w-none dark:shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
              <div className="flex h-full min-h-105 items-center justify-center rounded-[22px] border border-border/40 bg-zinc-950/40 p-2 lg:min-h-0 dark:bg-black/40">
                <img
                  src={AppScreenshotImage}
                  alt="ChronoFlow application preview"
                  className="h-full max-h-160 w-full rounded-[18px] object-contain"
                />
              </div>
            </div>

            <div className="order-2 flex h-full flex-col gap-3 rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm sm:min-h-30 lg:order-0">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
                <Sparkles className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Stock Mentor
                </h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered analysis and recommendations
                </p>
              </div>
              <div className="sm:mt-auto pt-3 border-t border-border">
                <div className="h-1.5 overflow-hidden rounded-sm bg-secondary">
                  <div className="h-full w-3/4 animate-pulse rounded-sm bg-primary" />
                </div>
              </div>
            </div>

            <div className="order-2 flex h-full flex-col gap-3 rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm sm:min-h-30 lg:order-0">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
                <Bell className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Smart Alerts
                </h3>
                <p className="text-sm text-muted-foreground">
                  Custom notifications for price movements
                </p>
              </div>
              <div className="sm:mt-auto pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-sm bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    3 alerts active
                  </span>
                </div>
              </div>
            </div>

            <div className="order-2 flex h-full flex-col gap-3 rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm sm:min-h-30 lg:order-0">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
                <Newspaper className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  News Topics
                </h3>
                <p className="text-sm text-muted-foreground">
                  View recent news related to a stock symbol
                </p>
              </div>
              <div className="sm:mt-auto pt-3 border-t border-border">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">
                    Yahoo, TheGuardian, ...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/60 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 sm:flex-row">
          <p className="text-center text-xs text-muted-foreground sm:text-left">
            AI Predictions are for learning, not financial advice.
          </p>
          <a
            href="https://github.com/twitocode"
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            <Github className="size-4" />
            @twitocode
          </a>
        </div>
      </footer>
    </div>
  )
}
