'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '#/components/ui/command'
import { ActiveAlertsIndicator } from '#/components/stocks/active-alerts-indicator'
import { topCompanies, getLogoUrl } from '#/lib/data'
import { cn } from '#/lib/utils'

interface StockSearchProps {
  alertCountBySymbol: Record<string, number>
  onSelect: (symbol: string) => void
  className?: string
}

export function StockSearch({ alertCountBySymbol, onSelect, className }: StockSearchProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((isOpen) => !isOpen)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelectCompany = (symbol: string) => {
    onSelect(symbol)
    setOpen(false)
  }

  return (
    <>
      <div className={cn('flex min-w-0 flex-1 items-center gap-2 sm:gap-3', className)}>
        <div className="relative min-w-0 flex-1 md:max-w-none md:flex-initial">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-border bg-background/80 py-2.5 pr-3 pl-10 text-left text-sm text-foreground shadow-sm transition-colors hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none md:w-64 md:bg-card"
          >
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <span className="truncate text-muted-foreground">Search companies...</span>
          </button>
        </div>
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
                  <div className="flex w-full min-w-0 items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white p-1">
                      <img
                        src={getLogoUrl(company.symbol, 32)}
                        alt={`${company.name} logo`}
                        className="size-6 object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold text-sm">{company.symbol}</span>
                      <span className="text-muted-foreground text-xs">{company.name}</span>
                    </div>
                    <ActiveAlertsIndicator
                      count={alertCountBySymbol[company.symbol] ?? 0}
                      className="shrink-0"
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
