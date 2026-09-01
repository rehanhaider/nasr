import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { cpSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

function pwaCopyPlugin() {
  return {
    name: 'pwa-copy-to-nitro',
    closeBundle() {
      // VitePWA emits to dist/; Nitro serves from .output/public/
      const dist = join(process.cwd(), 'dist')
      const outPublic = join(process.cwd(), '.output', 'public')
      if (!existsSync(dist) || !existsSync(outPublic)) return
      for (const f of readdirSync(dist)) {
        if (f === 'sw.js' || f.startsWith('workbox-') || f === 'manifest.webmanifest') {
          cpSync(join(dist, f), join(outPublic, f))
        }
      }
    },
  }
}

export default defineConfig({
  server: {
    port: 8080,
    host: '0.0.0.0',
  },
  plugins: [
    tanstackStart(),
    nitro(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png'],
      manifest: false,
      workbox: {
        globPatterns: [],
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'script' || request.destination === 'style' || request.destination === 'document',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'assets-cache', expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
    pwaCopyPlugin(),
  ],
})
