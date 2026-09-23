import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// All /api requests are forwarded to the FastAPI backend, so the frontend
// never hardcodes the backend origin and no CORS round-trip is needed.
const apiProxy = {
  '/api': {
    target: process.env.API_TARGET || 'http://127.0.0.1:8000',
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: apiProxy },
  preview: { port: 4173, proxy: apiProxy },
});
