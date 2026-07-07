import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  base: '/commonwealth-explorer/',

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/familysearch': {
        target: 'https://r.jina.ai/http://www.familysearch.org',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/familysearch/, ''),
      },
    },
  },
})
