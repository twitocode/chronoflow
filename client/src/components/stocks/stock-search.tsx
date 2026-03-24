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
import { topCompanies, getLogoUrl } from '#/lib/data'

interface StockSearchProps {
  onSelect: (symbol: string) => void
}

export function StockSearch({ onSelect }: StockSearchProps) {
  const [open, setOpen] = useState(false)

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

  const handleSelectCompany = (symbol: string) => {
    onSelect(symbol)
    setOpen(false)
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="hidden md:block relative">
          <button
            onClick={() => setOpen(true)}
            className="w-64 bg-card text-foreground pl-10 pr-4 py-2.5 rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm shadow-sm text-left flex items-center gap-2"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Search companies...</span>
          </button>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="md:hidden p-2.5 rounded-full bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors shadow-sm"
        >
          <Search className="size-4" />
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
                    <div className="size-8 rounded-lg bg-white p-1 flex items-center justify-center">
                      <img
                        src={getLogoUrl(company.symbol, 32)}
                        alt={`${company.name} logo`}
                        className="size-6 object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{company.symbol}</span>
                      <span className="text-muted-foreground text-xs">{company.name}</span>
                    </div>
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
