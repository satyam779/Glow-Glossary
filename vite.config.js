import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The React app lives in client/. In development Vite serves it on :5173 and forwards
// API and uploaded-image requests to the Express server on :3001.
export default defineConfig({
  root: 'client',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 700,
  },
  server: {
    port: 5173,
    // changeOrigin stays false so the API sees the browser's Host (its CSRF check compares it to Origin).
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: false },
      '/uploads': { target: 'http://localhost:3001', changeOrigin: false },
    },
  },
});
