import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative base lets the same build work on both root domains and subpath hosting.
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/ncaa': {
        target: 'https://ncaa-api.henrygd.me',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ncaa/, ''),
      },
    },
  },
})
