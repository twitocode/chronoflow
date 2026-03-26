'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useAuth } from '#/hooks/use-auth'
import { apiGet, apiWebSocketUrl } from '#/lib/api'
import { useToast } from '#/components/ui/toast-provider'

type TrackedStockItem = {
  id: number
  symbol: string
}

type StockAlertItem = {
  id: number
  symbol: string
  condition: 'above' | 'below' | string
  target_price: number
}

type ApiResponse<T> = {
  data: T
}

export function AlertsRealtime() {
  const { user } = useAuth()
  const { notify } = useToast()

  const { data: trackedStocksResponse } = useQuery<ApiResponse<TrackedStockItem[]>>({
    queryKey: ['tracked-stocks'],
    queryFn: () => apiGet('/api/v1/stocks/tracked'),
    enabled: !!user,
  })

  const { data: alertsResponse } = useQuery<ApiResponse<StockAlertItem[]>>({
    queryKey: ['stock-alerts'],
    queryFn: () => apiGet('/api/v1/alerts'),
    enabled: !!user,
  })

  const trackedSymbols = useMemo(
    () => (trackedStocksResponse?.data ?? []).map((item) => item.symbol).sort(),
    [trackedStocksResponse]
  )

  const alertsBySymbolRef = useRef<Map<string, StockAlertItem[]>>(new Map())
  const satisfactionRef = useRef<Map<number, boolean>>(new Map())
  const lastToastAtByAlertIdRef = useRef<Map<number, number>>(new Map())

  useEffect(() => {
    const nextMap = new Map<string, StockAlertItem[]>()
    const nextAlertIds = new Set<number>()

    for (const alert of alertsResponse?.data ?? []) {
      nextAlertIds.add(alert.id)
      const current = nextMap.get(alert.symbol) ?? []
      current.push(alert)
      nextMap.set(alert.symbol, current)
    }

    alertsBySymbolRef.current = nextMap
    satisfactionRef.current = new Map(
      [...satisfactionRef.current.entries()].filter(([id]) => nextAlertIds.has(id))
    )
    lastToastAtByAlertIdRef.current = new Map(
      [...lastToastAtByAlertIdRef.current.entries()].filter(([id]) => nextAlertIds.has(id))
    )
  }, [alertsResponse])

  useEffect(() => {
    if (!user || trackedSymbols.length === 0) {
      return
    }

    const sockets = trackedSymbols.map((symbol) => {
      const socket = new WebSocket(
        apiWebSocketUrl(`/api/v1/stocks/ws?symbol=${encodeURIComponent(symbol)}`)
      )

      socket.addEventListener('message', (event) => {
        const trade = JSON.parse(event.data) as { price?: number }
        const price = trade.price

        if (typeof price !== 'number' || Number.isNaN(price)) {
          return
        }

        for (const alert of alertsBySymbolRef.current.get(symbol) ?? []) {
          const wasSatisfied = satisfactionRef.current.get(alert.id) ?? false
          const isSatisfied =
            alert.condition === 'above'
              ? price >= alert.target_price
              : price <= alert.target_price

          if (isSatisfied && !wasSatisfied) {
            const now = Date.now()
            const lastAt = lastToastAtByAlertIdRef.current.get(alert.id) ?? 0
            // Same edge can fire twice in one tick (duplicate messages / reconnect).
            if (now - lastAt >= 2500) {
              lastToastAtByAlertIdRef.current.set(alert.id, now)
              satisfactionRef.current.set(alert.id, true)
              notify({
                title: `${alert.symbol} alert triggered`,
                description: `${alert.symbol} moved ${alert.condition} $${alert.target_price.toFixed(2)} and is now trading at $${price.toFixed(2)}.`,
              })
            } else {
              satisfactionRef.current.set(alert.id, true)
            }
          } else {
            satisfactionRef.current.set(alert.id, isSatisfied)
          }
        }
      })

      return socket
    })

    return () => {
      for (const socket of sockets) {
        socket.close()
      }
    }
  }, [notify, trackedSymbols, user])

  return null
}
