import { useLocation } from '@tanstack/react-router'
import { Github } from 'lucide-react'

export function AppFooter() {
  const location = useLocation()
  if (location.pathname === '/landing') {
    return null
  }
  return (
    <footer className="mt-auto w-full min-w-0 border-t border-border/60 bg-background/50 py-8">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <p className="text-xs text-muted-foreground">AI Predictions are for learning, not financial advice.</p>
        <a
          href="https://github.com/twitocode"
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          target="_blank"
          rel="noreferrer"
        >
          <Github className="size-4" />
          <span>@twitocode</span>
        </a>
      </div>
    </footer>
  )
}
