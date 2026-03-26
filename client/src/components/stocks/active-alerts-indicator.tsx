'use client'

import { cn } from '#/lib/utils'

type Props = {
  count: number
  className?: string
}

export function ActiveAlertsIndicator({ count, className }: Props) {
  const hasAlerts = count > 0
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'size-2 shrink-0 rounded-sm',
          hasAlerts ? 'animate-pulse bg-emerald-400' : 'bg-muted-foreground/40',
        )}
        aria-hidden
      />
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        {hasAlerts ? (
          <>
            {count} alert{count === 1 ? '' : 's'} active
          </>
        ) : (
          'No alerts'
        )}
      </span>
    </div>
  )
}
