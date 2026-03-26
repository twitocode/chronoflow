import { Link, useLocation } from '@tanstack/react-router'
import ThemeToggle from '#/components/ThemeToggle'
import { useAuth } from '#/hooks/use-auth'

export function AppHeader() {
  const { user, logout, isLoading } = useAuth()
  const location = useLocation()

  if (location.pathname === '/landing') {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full min-w-0 border-b border-border/60 bg-background/75 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="font-display text-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
        >
          Chrono<span className="text-primary">Flow</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          {isLoading ? null : user ? (
            <>
              <ThemeToggle />
              <span className="hidden max-w-[200px] truncate text-xs text-muted-foreground sm:inline sm:max-w-[280px]">
                {user.email}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
