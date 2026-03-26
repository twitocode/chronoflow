'use client'

import { Link, useRouterState } from '@tanstack/react-router'
import { Bell, TrendingUp } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { alertsHeaderVariants } from '#/components/motion/alerts-motion'
import { cn } from '#/lib/utils'

export function AlertsPageHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const reduceMotion = useReducedMotion()
  const onDashboard = pathname === '/'
  const onAlerts = pathname === '/alerts'

  return (
    <motion.header
      className="mb-8 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm backdrop-blur-sm sm:p-5"
      initial={reduceMotion ? false : 'hidden'}
      animate={reduceMotion ? undefined : 'visible'}
      variants={reduceMotion ? undefined : alertsHeaderVariants}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4 md:gap-5">
        <div className="flex flex-row items-center gap-2">
          <Link
            to="/"
            title="Dashboard"
            className={cn(
              'inline-flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors',
              onDashboard
                ? 'bg-primary/10 text-primary ring-primary/15'
                : 'bg-muted text-muted-foreground ring-border/60 hover:bg-primary/10 hover:text-primary',
            )}
          >
            <TrendingUp className="size-4" />
          </Link>
          <Link
            to="/alerts"
            title="Your alerts"
            className={cn(
              'inline-flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors',
              onAlerts
                ? 'bg-primary/10 text-primary ring-primary/15'
                : 'bg-muted text-muted-foreground ring-border/60 hover:bg-primary/10 hover:text-primary',
            )}
          >
            <Bell className="size-4" />
          </Link>
        </div>

        <div className="hidden h-8 w-px shrink-0 bg-border sm:block" />

        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Your alerts
          </h1>
          <p className="text-sm text-muted-foreground">
            Thresholds fire when live prices cross them
          </p>
        </div>
      </div>
    </motion.header>
  )
}
