import { Link, HeadContent, Scripts, createRootRouteWithContext, Outlet, useLocation } from '@tanstack/react-router'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import TanStackQueryProvider from '../integrations/tanstack-query/root-provider'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'
import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'ChronoFlow' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

import { useAuth, AuthProvider } from '../hooks/use-auth.tsx'
import { Github } from "lucide-react";

function AppHeader() {
  const { user, logout, isLoading } = useAuth()
  const location = useLocation()
  
  // Hide header on landing page
  if (location.pathname === '/landing') {
    return null
  }
  
  return (
    <header className="py-3">
      <div className="mx-auto max-w-3xl px-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">ChronoFlow</Link>
          <nav className="flex gap-4 items-center">
            {isLoading ? null : user ? (
              <>
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <button onClick={() => void logout()} className="hover:underline cursor-pointer">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:underline">Login</Link>
                <Link to="/register" className="hover:underline">Register</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

 function AppFooter() {
  return (
    <footer className="mx-auto w-full flex justify-center pt-3 pb-10">
      <a href="https://github.com/twitocode" className="flex space-x-4" >
        <Github /> <span>@twitocode</span>
      </a>
    </footer>
  )
}

function AuthAwareOutlet() {
  const { user, isLoading } = useAuth()
  
  // Show nothing while loading auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  return <Outlet />
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
        <TanStackQueryProvider>
          <AuthProvider>
            <AppHeader />
            <AuthAwareOutlet />
            <AppFooter />
            <TanStackDevtools
              config={{ position: 'bottom-right' }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
                TanStackQueryDevtools,
              ]}
            />
          </AuthProvider>
        </TanStackQueryProvider>
        <Scripts />
      </body>
    </html>
  )
}

