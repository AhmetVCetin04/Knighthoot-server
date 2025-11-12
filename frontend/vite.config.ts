/*import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
  allowedHosts: ['knighthoot.app']

  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'https://174.138.73.101:5173', 
        changeOrigin: true,
        secure: false,
        ws: false,
      },
    },
  },
})*/

// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_ORIGIN = env.VITE_API_ORIGIN || 'https://174.138.73.101:5173'

  return {
    plugins: [react()],
    server: {
      host: true,              
      port: 5174,
      allowedHosts: [
        'knighthoot.app',
        'www.knighthoot.app',
        '174.138.73.101',
      ],
      proxy: {
        '/api': {
          target: API_ORIGIN,
          changeOrigin: true,
          secure: API_ORIGIN.includes('knighthoot.app'), 
          ws: false,
        },
      },
    },

    preview: {
      allowedHosts: ['knighthoot.app', 'www.knighthoot.app'],
    },
  }
})
