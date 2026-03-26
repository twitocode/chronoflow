import { HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import TanStackQueryProvider from '#/integrations/tanstack-query/root-provider'
import TanStackQueryDevtools from '#/integrations/tanstack-query/devtools'
import { AlertsRealtime } from '#/components/stocks/alerts-realtime'
import { ToastProvider } from '#/components/ui/toast-provider'
import { AuthProvider } from '#/hooks/use-auth'
import { AppHeader } from '#/components/layout/app-header'
import { AppFooter } from '#/components/layout/app-footer'
import { AuthAwareOutlet } from '#/components/layout/auth-aware-outlet'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export function RootDocument(_props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans wrap-anywhere selection:bg-primary/20 overflow-x-hidden">
        <TanStackQueryProvider>
          <ToastProvider>
            <AuthProvider>
              <AlertsRealtime />
              <div className="flex min-h-screen w-full min-w-0 flex-col">
                <AppHeader />
                <div className="min-w-0 flex-1">
                  <AuthAwareOutlet />
                </div>
                <AppFooter />
              </div>
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
          </ToastProvider>
        </TanStackQueryProvider>
        <Scripts />
      </body>
    </html>
  )
}
