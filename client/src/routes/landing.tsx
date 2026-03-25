import { Button } from '#/components/ui/button'
import { useAuth } from '#/hooks/use-auth'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Bell, Newspaper, Sparkles, TrendingUp } from 'lucide-react'
import AppScreenshotImage from '../assets/app-screenshot.png'

export const Route = createFileRoute('/landing')({
  component: LandingPage,
})

function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <span className="text-xl font-bold text-foreground">ChronoFlow</span>

        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/">
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Go to App
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Section - Hero */}
        <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 py-8 lg:py-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium w-fit mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by AI
          </div>

          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight text-balance mb-4">
            Smarter stock trading starts here
          </h1>

          <p className="text-muted-foreground text-lg max-w-md mb-8 text-pretty">
            Real-time market data, AI-powered insights, and intelligent alerts
            to help you make better investment decisions.
          </p>

          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/">
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Go to App
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Find Insights
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Right Section - Feature Cards */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 min-h-0">
          <div className="grid w-full max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,220px)_minmax(0,320px)_minmax(0,220px)] lg:grid-rows-2">
            {/* Live Prices Card */}
            <div className="order-2 bg-card border border-border rounded-xl p-5 flex h-full sm:min-h-30 flex-col gap-3 lg:order-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Live Prices
                </h3>
                <p className="text-sm text-muted-foreground">
                  Real-time market data with millisecond updates
                </p>
              </div>
              <div className="sm:mt-auto pt-3 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">MSFT</span>
                  <span className="text-emerald-400">+2.34%</span>
                </div>
              </div>
            </div>

            {/* App Preview */}
            <div className="order-1 mx-auto w-full max-w-sm overflow-hidden rounded-[28px] bg-linear-to-b from-card to-card/80 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:col-span-2 lg:order-0 lg:col-span-1 lg:row-span-2 lg:max-w-none">
              <div className="flex h-full min-h-105 items-center justify-center rounded-[22px] border border-border/60 bg-black/30 p-2 lg:min-h-0">
                <img
                  src={AppScreenshotImage}
                  alt="ChronoFlow application preview"
                  className="h-full max-h-160 w-full rounded-[18px] object-contain"
                />
              </div>
            </div>

            {/* AI Mentor Card */}
            <div className="order-2 bg-card border border-border rounded-xl p-5 flex h-full sm:min-h-30 flex-col gap-3 lg:order-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Stock Mentor
                </h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered analysis and recommendations
                </p>
              </div>
              <div className="sm:mt-auto pt-3 border-t border-border">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-primary rounded-full animate-pulse" />
                </div>
              </div>
            </div>

            {/* Smart Alerts Card */}
            <div className="order-2 bg-card border border-border rounded-xl p-5 flex h-full sm:min-h-30 flex-col gap-3 lg:order-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Smart Alerts
                </h3>
                <p className="text-sm text-muted-foreground">
                  Custom notifications for price movements
                </p>
              </div>
              <div className="sm:mt-auto pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    3 alerts active
                  </span>
                </div>
              </div>
            </div>

            {/* News Topics Card */}
            <div className="order-2 bg-card border border-border rounded-xl p-5 flex h-full sm:min-h-30 flex-col gap-3 lg:order-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  News Topics
                </h3>
                <p className="text-sm text-muted-foreground">
                  View recent news related to a stock symbol
                </p>
              </div>
              <div className="sm:mt-auto pt-3 border-t border-border">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">
                    Yahoo, TheGuardian, ...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
