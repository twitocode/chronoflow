'use client'

import { Sparkles } from 'lucide-react'
import { Skeleton } from '#/components/ui/skeleton'

interface AIPredictionProps {
  prediction?: string
  isLoading: boolean
  isError: boolean
}

export function AIPrediction({ prediction, isLoading, isError }: AIPredictionProps) {
  return (
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

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-2 w-full bg-gradient-to-r from-primary/40 to-accent/40" />
          <Skeleton className="h-2 w-4/5 bg-gradient-to-r from-primary/30 to-accent/30" />
          <Skeleton className="h-2 w-3/5 bg-gradient-to-r from-primary/20 to-accent/20" />
        </div>
      ) : isError ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">Login to view AI predictions</p>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm mt-4 leading-relaxed">
          {prediction || 'Based on historical data and market trends, this stock is expected to see moderate growth over the next quarter.'}
        </p>
      )}
    </div>
  )
}
