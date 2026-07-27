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
      { title: 'Mizan' },
      { name: 'theme-color', content: '#1e3a8a' },
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
  { to: '/' as const, label: 'Today' },
  { to: '/deen/history' as const, label: 'History' },
  { to: '/pipeline' as const, label: 'Pipeline' },
  { to: '/review' as const, label: 'Review' },
]

function RootDocument({ children }: { children: ReactNode }) {
  const location = useLocation()
  const isLogin = location.pathname === '/login'

  return (
    <html lang="en" className="bg-gray-50 text-gray-900">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen font-sans antialiased">
        {!isLogin && (
          <nav className="sticky top-0 z-50 bg-primary-900 text-white shadow-md">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
              <Link to="/" className="text-lg font-bold tracking-tight">
                Mizan
              </Link>
              <div className="flex gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary-800 [&.active]:bg-primary-700"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/settings"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary-800 [&.active]:bg-primary-700"
                >
                  Settings
                </Link>
              </div>
            </div>
          </nav>
        )}
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <Scripts />
      </body>
    </html>
  )
}
