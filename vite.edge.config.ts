import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base: '/edge/',
  plugins: [react()],
  build: { outDir: 'dist-edge', emptyOutDir: true, rollupOptions: { input: 'edge/index.html' } },
});
