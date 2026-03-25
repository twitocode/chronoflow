'use client'

import { ChartComponent } from '#/components/charts/ChartComponent'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { TrendingUp, TrendingDown, Clock, Info } from 'lucide-react'
import { cn } from '#/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select"

interface ChartDataPoint {
  time: number
  value: number
}

const periods = ['1D', '1W', '1M', '3M', '1Y', 'ALL']

const getIsMarketOpen = () => {
  const now = new Date()
  const nyDate = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }))
  
  const day = nyDate.getDay() // 0 is Sunday, 6 is Saturday
  const hour = nyDate.getHours()
  const minute = nyDate.getMinutes()
  
  const isWeekend = day === 0 || day === 6
  const timeInMinutes = hour * 60 + minute
  const isOpenTime = timeInMinutes >= (9 * 60 + 30) && timeInMinutes < (16 * 60)

  return !isWeekend && isOpenTime
}

const generateInitialData = (): ChartDataPoint[] => {
  const data: ChartDataPoint[] = []
  let price = 150
  const now = Math.floor(Date.now() / 1000)
  
  for (let i = 100; i >= 0; i--) {
    price += (Math.random() - 0.5) * 2
    data.push({
      time: now - i,
      value: parseFloat(price.toFixed(2)),
    })
  }
  return data
}

export function StockChart() {
  const [activePeriod, setActivePeriod] = useState('1M')
  const [data, setData] = useState<ChartDataPoint[]>(generateInitialData())
  const [isMarketOpen, setIsMarketOpen] = useState(getIsMarketOpen())

  // Check market status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setIsMarketOpen(getIsMarketOpen())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const addRandomTrade = useCallback(() => {
    if (!isMarketOpen) return // Only update data if market is open (simulated)
    
    setData((currentData) => {
      const lastEntry = currentData[currentData.length - 1]
      const volatility = 0.5
      const change = (Math.random() - 0.5) * volatility
      const newPrice = parseFloat((lastEntry.value + change).toFixed(2))
      const nextTime = lastEntry.time + 1
      
      return [...currentData, {
        time: nextTime,
        value: newPrice,
      }]
    })
  }, [isMarketOpen])

  useEffect(() => {
    const interval = setInterval(addRandomTrade, 1000)
    return () => clearInterval(interval)
  }, [addRandomTrade])

  const { lastPrice, priceChange, percentChange, isPositive } = useMemo(() => {
    const last = data[data.length - 1].value
    const first = data[0].value
    const change = last - first
    return {
      lastPrice: last,
      priceChange: change,
      percentChange: (change / first) * 100,
      isPositive: change >= 0
    }
  }, [data])

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm mb-6 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">${lastPrice.toFixed(2)}</span>
            <span className={cn(
              "flex items-center gap-1 text-xs sm:text-sm font-medium",
              isPositive ? 'text-green-500' : 'text-red-500'
            )}>
              {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({percentChange.toFixed(2)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Live Price</p>
            {!isMarketOpen && (
              <span className="flex items-center gap-1 text-[9px] sm:text-[10px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20 font-bold uppercase tracking-tighter">
                <Clock className="size-2" /> After Hours
              </span>
            )}
          </div>
        </div>
        
        {/* Desktop Toggle */}
        <div className="hidden sm:flex items-center bg-secondary/50 p-1 rounded-lg gap-1 border border-border">
          {periods.map((period) => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200",
                activePeriod === period 
                  ? 'bg-primary text-primary-foreground shadow-sm scale-[1.05]' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Mobile Select */}
        <div className="flex sm:hidden w-full">
          <Select value={activePeriod} onValueChange={setActivePeriod}>
            <SelectTrigger className="w-full bg-secondary/30 h-10">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period} value={period}>
                  {period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="h-[250px] sm:h-[300px] w-full relative">
        <div className={cn(
          "h-full w-full transition-all duration-700 ease-in-out",
          !isMarketOpen && "blur-xl grayscale-[0.5] opacity-80 pointer-events-none"
        )}>
          <ChartComponent data={data} />
        </div>

        {!isMarketOpen && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
            <div className="bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 max-w-[280px] text-center">
              <div className="size-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                <Clock className="size-6 text-yellow-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Markets are Closed</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed px-2">
                  Trading is unavailable. Market hours are Monday - Friday, 9:30 AM - 4:00 PM ET.
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
