'use client'

import { StockDashboard } from '#/components/stocks/stock-dashboard'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '../hooks/use-auth'

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
      <div className="min-h-screen flex items-center justify-center flex-col space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="text-primary font-medium">
          Loading from Server (may take a while)
        </span>
      </div>
    )
  }

  return <StockDashboard />
}
