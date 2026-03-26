'use client'

import { Skeleton } from '#/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

interface NewsItem {
  title: string
  description: string
  url: string
  image_url: string
  published_at: string
  source: string
}

interface NewsListProps {
  news: NewsItem[]
  isLoading: boolean
  isError: boolean
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

export function NewsList({ news, isLoading, isError }: NewsListProps) {
  const displayNews = news.slice(0, 3)

  return (
    <Card className="rounded-2xl border border-border/80 bg-card/80 shadow-md backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg font-semibold tracking-tight text-foreground">
          Recent news
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-2xl bg-secondary/50 animate-pulse">
                <Skeleton className="h-4 w-3/4 rounded mb-2" />
                <Skeleton className="h-3 w-1/4 rounded" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Unable to load news</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayNews.map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-transparent bg-muted/40 p-3 transition-colors hover:border-border hover:bg-muted/70"
              >
                <p className="text-sm text-foreground leading-snug">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {timeAgo(item.published_at)} • {item.source}
                </p>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
