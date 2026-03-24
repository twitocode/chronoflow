'use client'

import { ChartComponent } from '#/components/charts/ChartComponent'
import { useEffect, useState, useCallback } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface ChartDataPoint {
  time: number
  value: number
}

const periods = ['1D', '1W', '1M', '3M', '1Y', 'ALL']

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

  const addRandomTrade = useCallback(() => {
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
  }, [])

  useEffect(() => {
    const interval = setInterval(addRandomTrade, 1000)
    return () => clearInterval(interval)
  }, [addRandomTrade])

  const lastPrice = data[data.length - 1].value
  const firstPrice = data[0].value
  const priceChange = lastPrice - firstPrice
  const percentChange = (priceChange / firstPrice) * 100
  const isPositive = priceChange >= 0

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-foreground tracking-tight">${lastPrice.toFixed(2)}</span>
            <span className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({percentChange.toFixed(2)}%)
            </span>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Live Price</p>
        </div>
        
        <div className="flex items-center bg-secondary/50 p-1 rounded-lg gap-1 border border-border">
          {periods.map((period) => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                activePeriod === period 
                  ? 'bg-primary text-primary-foreground shadow-sm scale-[1.05]' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-[300px] w-full overflow-hidden">
        <ChartComponent data={data} />
      </div>
    </div>
  )
}
