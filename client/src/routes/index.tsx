'use client'

import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../hooks/use-auth'
import { StockDashboard } from '#/components/stocks/stock-dashboard'

export const Route = createFileRoute('/')({
  component: HomeRoute,
})

function HomeRoute() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate({ to: '/landing' })
      }
    }
  }, [user, isLoading, navigate])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <StockDashboard />
}
