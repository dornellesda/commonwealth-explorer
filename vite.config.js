import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  base: '/',

  build: {
    // Target Android 7.1.2 WebView which corresponds to Chrome ~55
    target: ['chrome55'],
  },

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
