'use client'

import { Sparkles, CheckCircle2, AlertCircle, HelpCircle, Info } from 'lucide-react'
import { Skeleton } from '#/components/ui/skeleton'
import { cn } from '#/lib/utils'

interface StockMentorData {
  simple_headline: string
  vibe: 'Positive' | 'Steady' | 'Concerning' | string
  explanation: string
  beginner_tip: string
  action_step: string
}

interface AIPredictionProps {
  prediction?: StockMentorData
  isLoading: boolean
  isError: boolean
}

export function AIPrediction({ prediction, isLoading, isError }: AIPredictionProps) {
  const getVibeConfig = (vibe: string = "") => {
    const v = vibe.toLowerCase()
    if (v.includes('positive') || v.includes('bullish') || v.includes('good')) {
      return { 
        color: "text-green-500", 
        bg: "bg-green-500/10", 
        border: "border-green-500/20",
        icon: CheckCircle2,
        label: "Looking Good" 
      }
    }
    if (v.includes('concerning') || v.includes('negative') || v.includes('bearish') || v.includes('bad')) {
      return { 
        color: "text-red-500", 
        bg: "bg-red-500/10", 
        border: "border-red-500/20",
        icon: AlertCircle,
        label: "Risky" 
      }
    }
    return { 
      color: "text-yellow-500", 
      bg: "bg-yellow-500/10", 
      border: "border-yellow-500/20",
      icon: HelpCircle,
      label: "Mixed Signals" 
    }
  }

  const vibeConfig = getVibeConfig(prediction?.vibe)
  const VibeIcon = vibeConfig.icon

  return (
    <div className="group relative mb-6 overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-6 shadow-md backdrop-blur-sm">
      {/* Decorative background pulse */}
      <div className="absolute -right-4 -top-4 size-32 rounded-3xl bg-primary/5 blur-3xl transition-colors duration-500 group-hover:bg-primary/10" />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight text-foreground">Stock Mentor</h2>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Powered by AI</p>
          </div>
        </div>
        
        {!isLoading && !isError && prediction && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
              Stock Sentiment
            </span>
            <div className={cn(
              "flex items-center gap-1.5 rounded-md border px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm",
              vibeConfig.bg, vibeConfig.color, vibeConfig.border
            )}>
              <VibeIcon className="size-3" />
              {vibeConfig.label}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-3/4 rounded-lg bg-secondary/50" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full bg-secondary/30" />
            <Skeleton className="h-3 w-full bg-secondary/30" />
            <Skeleton className="h-3 w-4/5 bg-secondary/30" />
          </div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-secondary/20 rounded-2xl border border-dashed border-border/50">
          <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-secondary/50">
            <Info className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Analysis Unavailable</p>
          <p className="text-xs text-muted-foreground mt-1 px-4">Log in to unlock AI-powered insights for your portfolio.</p>
        </div>
      ) : (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div>
            <h3 className="text-lg font-bold text-foreground leading-tight tracking-tight mb-2">
              {prediction?.simple_headline || "What's happening with the stock today?"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              {prediction?.explanation || "We're currently gathering data to give you the best insight possible."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="bg-secondary/30 p-4 rounded-2xl border border-border/50 flex flex-col gap-2">
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                <Info className="size-3" /> Mentor Tip
              </span>
              <p className="text-[11px] text-muted-foreground leading-normal italic">
                "{prediction?.beginner_tip || "Every stock has a story to learn."}"
              </p>
            </div>
            
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex flex-col gap-2">
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="size-3" /> Next Step
              </span>
              <p className="text-[11px] text-foreground font-semibold leading-normal">
                {prediction?.action_step || "Watch the chart to see if people agree with the news."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
