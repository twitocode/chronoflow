'use client'

import { Link } from '@tanstack/react-router'
import { Bell, TrendingUp, User } from 'lucide-react'
import { ActiveAlertsIndicator } from '#/components/stocks/active-alerts-indicator'
import { Button } from '#/components/ui/button'
import { StockSearch } from './stock-search'
import { getLogoUrl } from '#/lib/data'

interface StockHeaderProps {
  symbol: string
  companyName: string
  /** Per-symbol alert counts (all user alerts for that ticker). */
  alertCountBySymbol: Record<string, number>
  onSymbolChange: (symbol: string) => void
  onOpenCreateAlert: () => void
}

export function StockHeader({
  symbol,
  companyName,
  alertCountBySymbol,
  onSymbolChange,
  onOpenCreateAlert,
}: StockHeaderProps) {
  return (
    <header className="mb-8 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm backdrop-blur-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        {/* Left: on mobile, nav column + stock sit in one row; sm+ adds divider and aligns in a row */}
        <div className="flex min-w-0 flex-row items-center gap-3 sm:gap-4 lg:gap-5">
          <div className="flex shrink-0 flex-row items-center gap-2">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <TrendingUp className="size-4" />
            </span>
            <Link
              to="/alerts"
              className="inline-flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-border/60 transition-colors hover:bg-primary/10 hover:text-primary"
              title="Your alerts"
            >
              <Bell className="size-4" />
            </Link>
          </div>

          <div className="hidden h-8 w-px shrink-0 self-center bg-border sm:block" />

          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center shadow-sm  sm:size-11 dark:bg-card">
              <img
                src={getLogoUrl(symbol, 40)}
                alt={`${companyName} logo`}
                className="size-full object-contain ring-1 ring-border/50"
                loading="lazy"
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="font-mono-nums text-lg font-semibold tracking-tight text-foreground sm:text-xl md:text-2xl">
                  {symbol}
                </h1>
                <ActiveAlertsIndicator
                  count={alertCountBySymbol[symbol] ?? 0}
                  className="sm:pt-0.5"
                />
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground sm:truncate sm:text-sm">
                {companyName}
              </p>
            </div>
          </div>
        </div>

        {/* Actions: stack on small screens, row on sm+ */}
        <div className="flex w-full min-w-0 flex-col gap-2.5 border-t border-border/50 pt-4 sm:w-auto sm:flex-row sm:items-center sm:gap-2 sm:border-t-0 sm:pt-0 md:gap-3 lg:max-w-xl lg:shrink-0">
          <StockSearch
            alertCountBySymbol={alertCountBySymbol}
            onSelect={onSymbolChange}
            className="w-full sm:min-w-0 lg:max-w-xs"
          />
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              className="h-10 min-w-0 flex-1 rounded-xl shadow-sm sm:min-w-30 sm:flex-initial"
              onClick={onOpenCreateAlert}
            >
              Save alert
            </Button>
            {/* <button
              type="button"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
              aria-label="Account"
            >
              <User className="size-4" />
            </button> */}
          </div>
        </div>
      </div>
    </header>
  )
}
