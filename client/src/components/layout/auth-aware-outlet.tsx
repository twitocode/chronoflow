import { AnimatedOutlet } from '#/components/motion/animated-outlet'
import { useAuth } from '#/hooks/use-auth'

export function AuthAwareOutlet() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span>Loading from Server (may take a while)</span>
      </div>
    )
  }

  return <AnimatedOutlet />
}
