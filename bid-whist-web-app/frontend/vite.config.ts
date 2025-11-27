import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    // Enable SPA routing - fallback to index.html for all routes
    // This fixes 404 errors when refreshing on routes like /game/1234
    historyApiFallback: true,
  },
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});