import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true, // fail instead of silently using another port (the backend CORS expects 5173)
    // In development, forward /api requests to the backend. The browser then sees ONE origin,
    // so there are no CORS or cookie problems while developing.
    proxy: { '/api': 'http://localhost:5000' },
  },
})