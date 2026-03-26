'use client'

import { ChartComponent } from '#/components/charts/ChartComponent'
import { apiGet, apiWebSocketUrl } from '#/lib/api'
import { cn } from '#/lib/utils'
import { Clock, Info, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface ChartDataPoint {
  time: number
  value: number
}


function isMarketOpenForced(): boolean {
  return import.meta.env.VITE_FORCE_MARKET_OPEN === 'true'
}

function getScheduleMarketOpen(): boolean {
  const now = new Date()
  const nyDate = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/New_York' }),
  )

  const day = nyDate.getDay() // 0 is Sunday, 6 is Saturday
  const hour = nyDate.getHours()
  const minute = nyDate.getMinutes()

  const isWeekend = day === 0 || day === 6
  const timeInMinutes = hour * 60 + minute
  const isOpenTime = timeInMinutes >= 9 * 60 + 30 && timeInMinutes < 16 * 60

  return !isWeekend && isOpenTime
}

const getIsMarketOpen = () =>
  isMarketOpenForced() || getScheduleMarketOpen()

export type StockChartAlertLevel = {
  id: number
  targetPrice: number
  condition: string
}

interface Props {
  symbol: string
  /** Alert thresholds for this symbol (dashed lines on the chart). */
  alerts?: StockChartAlertLevel[]
}

export function StockChart(props: Props) {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [isMarketOpen, setIsMarketOpen] = useState(getIsMarketOpen())

  useEffect(() => {
    setIsMarketOpen(getIsMarketOpen())
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setIsMarketOpen(getIsMarketOpen())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let cancelled = false
    setData([])

    async function init() {
      try {
        const res = await apiGet<{ data: { symbol: string; price: number; time: number }[] }>(
          `/api/v1/stocks/history?symbol=${encodeURIComponent(props.symbol)}`,
        )
        if (cancelled) return
        if (res.data?.length) {
          const initial: ChartDataPoint[] = []
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
        // history unavailable, chart starts empty, live ticks will fill it
      }

      if (cancelled) return

      const socket = new WebSocket(
        apiWebSocketUrl(`/api/v1/stocks/ws?symbol=${encodeURIComponent(props.symbol)}`),
      )
      socketRef.current = socket

      socket.addEventListener('message', (event) => {
        const trade = JSON.parse(event.data)
        setData((old) => {
          const t = Math.floor(trade.time / 1000)
          const value = trade.price as number
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
  }, [props.symbol])

  const { lastPrice, priceChange, percentChange, isPositive } = useMemo(() => {
    if (data.length == 0) {
      return {
        lastPrice: 0,
        priceChange: 0,
        percentChange: 0,
        isPositive: true,
      }
    }

    const last = data[data.length - 1].value
    const first = data[0].value
    const change = last - first
    return {
      lastPrice: last,
      priceChange: change,
      percentChange: (change / first) * 100,
      isPositive: change >= 0,
    }
  }, [data])

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-4 shadow-md backdrop-blur-sm sm:p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col">
          <div className="mb-1 flex items-baseline gap-2">
            <span className="font-mono-nums text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              ${lastPrice.toFixed(2)}
            </span>
            <span
              className={cn(
                'flex items-center gap-1 text-xs sm:text-sm font-medium',
                isPositive ? 'text-green-500' : 'text-red-500',
              )}
            >
              {isPositive ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {isPositive ? '+' : ''}
              {priceChange.toFixed(2)} ({percentChange.toFixed(2)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Live Price
            </p>
            {!isMarketOpen && (
              <span className="flex items-center gap-1 text-[9px] sm:text-[10px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20 font-bold uppercase tracking-tighter">
                <Clock className="size-2" /> After Hours
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="h-[250px] sm:h-[300px] w-full relative">
        <div
          className={cn(
            'h-full w-full transition-all duration-700 ease-in-out',
            !isMarketOpen &&
              'blur-xl grayscale-[0.5] opacity-80 pointer-events-none',
          )}
        >
          {data.length > 0 && (
            <ChartComponent data={data} alertLevels={props.alerts ?? []} />
          )}
        </div>

        {!isMarketOpen && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
            <div className="bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 max-w-[280px] text-center">
              <div className="size-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                <Clock className="size-6 text-yellow-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">
                  Markets are Closed
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed px-2">
                  Trading is unavailable. Market hours are Monday - Friday, 9:30
                  AM - 4:00 PM ET.
                </p>
              </div>
              <button className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
                <Info className="size-3" /> View Schedule
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
