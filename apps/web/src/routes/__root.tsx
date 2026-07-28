import type { ReactNode } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  Link,
  useLocation,
} from '@tanstack/react-router'
import appCss from '../styles/app.css?url'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Nasr' },
      { name: 'theme-color', content: '#08080a' },
      { name: 'color-scheme', content: 'dark' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.json' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  const { queryClient } = Route.useRouteContext()
  return (
    <QueryClientProvider client={queryClient}>
      <RootDocument>
        <Outlet />
      </RootDocument>
    </QueryClientProvider>
  )
}

const navItems = [
  { to: '/' as const, label: 'Today', exact: true },
  { to: '/deen/history' as const, label: 'History', exact: false },
  { to: '/deen/observations' as const, label: 'Notes', exact: false },
  { to: '/pipeline' as const, label: 'Pipeline', exact: false },
  { to: '/review' as const, label: 'Review', exact: false },
]

const navLink =
  'shrink-0 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-100 [&.active]:bg-elevated [&.active]:text-zinc-100'

function RootDocument({ children }: { children: ReactNode }) {
  const location = useLocation()
  const isLogin = location.pathname === '/login'

  return (
    <html lang="en" className="bg-canvas">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-canvas text-zinc-100 antialiased">
        {!isLogin && (
          <header className="sticky top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:gap-6">
              <Link to="/" className="flex shrink-0 items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-500 shadow-[0_0_10px_var(--color-primary-500)]" />
                <span className="text-[15px] font-semibold tracking-tight text-zinc-100">nasr</span>
              </Link>

              <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: item.exact }}
                    className={navLink}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <Link to="/settings" className={navLink}>
                Settings
              </Link>
            </div>
          </header>
        )}
        <main className={isLogin ? '' : 'mx-auto max-w-5xl px-4 py-8'}>{children}</main>
        <Scripts />
      </body>
    </html>
  )
}
