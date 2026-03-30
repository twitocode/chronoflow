'use client'

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { AlertsPageHeader } from '#/components/stocks/alerts-page-header'
import {
  alertsCardVariants,
  alertsEase,
  alertsListContainerVariants,
  alertsListItemVariants,
} from '#/components/motion/alerts-motion'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { apiDelete, apiGet } from '#/lib/api'
import { useAuth } from '#/hooks/use-auth'
import { getLogoUrl, topCompanies } from '#/lib/data'

type StockAlert = {
  id: number
  symbol: string
  condition: 'above' | 'below' | string
  target_price: number
  created_at: string
}

type ApiResponse<T> = {
  data: T
}

function companyName(symbol: string): string {
  return topCompanies.find((c) => c.symbol === symbol)?.name ?? symbol
}

export const Route = createFileRoute('/alerts')({
  component: AlertsRoute,
})

function AlertsRoute() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: '/landing' })
    }
  }, [isLoading, navigate, user])

  const {
    data: alertsResponse,
    isLoading: alertsLoading,
    error: alertsError,
  } = useQuery<ApiResponse<StockAlert[]>>({
    queryKey: ['stock-alerts'],
    queryFn: () => apiGet('/api/v1/alerts'),
    enabled: !!user,
  })

  const sortedAlerts = useMemo(() => {
    if (!alertsResponse?.data) return []
    return [...alertsResponse.data].sort((a, b) => a.symbol.localeCompare(b.symbol))
  }, [alertsResponse])

  const deleteAlertMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/v1/alerts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] })
    },
  })

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span>Loading from Server (may take a while)</span>
      </div>
    )
  }

  return (
    <main className="mx-auto min-h-full w-full min-w-0 max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <AlertsPageHeader />
      <motion.div
        variants={reduceMotion ? undefined : alertsCardVariants}
        initial={reduceMotion ? false : 'hidden'}
        animate={reduceMotion ? undefined : 'visible'}
      >
        <Card className="border-border/80 bg-card/80 shadow-md backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-lg font-semibold tracking-tight">All thresholds</CardTitle>
            <CardDescription>
              Create new alerts from the dashboard with Save alert while viewing a stock.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {alertsLoading ? (
              <p className="text-sm text-muted-foreground">Loading alerts...</p>
            ) : alertsError ? (
              <p className="text-sm font-medium text-destructive">
                Could not load alerts.
              </p>
            ) : sortedAlerts.length ? (
              <motion.div
                className="space-y-3"
                variants={reduceMotion ? undefined : alertsListContainerVariants}
                initial={reduceMotion ? false : 'hidden'}
                animate={reduceMotion ? undefined : 'visible'}
              >
                {sortedAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    layout={!reduceMotion}
                    variants={reduceMotion ? undefined : alertsListItemVariants}
                    className="flex items-center gap-4 rounded-xl border border-border/70 bg-card px-4 py-4 shadow-sm"
                  >
                    <img
                      src={getLogoUrl(alert.symbol)}
                      alt={alert.symbol}
                      className="size-9 shrink-0 rounded-lg object-contain"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-base font-semibold text-foreground">
                        {companyName(alert.symbol)}{' '}
                        <span className="text-sm font-normal text-muted-foreground">
                          {alert.symbol}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Trigger when price goes {alert.condition} $
                        {alert.target_price.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete alert ${alert.id}`}
                      onClick={() => deleteAlertMutation.mutate(alert.id)}
                      disabled={deleteAlertMutation.isPending}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                className="rounded-xl border border-dashed border-border/80 px-5 py-8 text-center"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                transition={alertsEase}
              >
                <p className="text-base font-semibold text-foreground">No alerts yet</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Open a stock from the dashboard and use the Save alert button to create your first one.
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  )
}
