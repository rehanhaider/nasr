import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'

export default defineConfig({
  server: {
    port: 8080,
    host: '0.0.0.0',
  },
  plugins: [
    tanstackStart(),
    nitro(),
    react(),
  ],
})
