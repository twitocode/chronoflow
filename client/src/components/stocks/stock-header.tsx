'use client'

import { Bell, TrendingUp, User } from 'lucide-react'
import { StockSearch } from './stock-search'
import { getLogoUrl } from '#/lib/data'

interface StockHeaderProps {
  symbol: string
  companyName: string
  onSymbolChange: (symbol: string) => void
}

export function StockHeader({ symbol, companyName, onSymbolChange }: StockHeaderProps) {
  return (
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
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-sm">
            <img
              src={getLogoUrl(symbol, 40)}
              alt={`${companyName} logo`}
              className="size-full object-contain"
              loading="lazy"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{symbol}</h1>
            <p className="text-sm text-muted-foreground">{companyName}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <StockSearch onSelect={onSymbolChange} />

        <button className="p-2.5 rounded-full bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors shadow-sm">
          <User className="size-4" />
        </button>
      </div>
    </header>
  )
}
