import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/*// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
  allowedHosts: ['knighthoot.app']

  }
})*/


export default defineConfig({
  plugins: [react()],
  server: {
  allowedHosts: ['knighthoot.app'],
    proxy: {
      '/api': {
        target: 'https://174.138.73.101:5173', // your server.js port since you can’t change it
        changeOrigin: true,
        secure: false,
      },
    },
  },
  base: '/',
})

