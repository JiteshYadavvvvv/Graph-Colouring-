import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// In development, /api requests are forwarded to the local FastAPI backend,
// so `npm run dev` needs no VITE_API_URL and no CORS round-trip.
const apiProxy = {
  '/api': {
    target: process.env.API_TARGET || 'http://127.0.0.1:8000',
    changeOrigin: true,
  },
};

export default defineConfig(({ command, mode }) => {
  // A deployed static site has no proxy: without VITE_API_URL the built app
  // would call /api on its own host and get 404s. Say so in the build log.
  if (command === 'build' && !loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL) {
    console.warn(
      '\n[config] VITE_API_URL is not set for this build. The app will call /api on its own origin,\n' +
        '         which only works behind a proxy (e.g. `npm run preview`). Set it to the FastAPI origin.\n',
    );
  }
  return {
    plugins: [react()],
    server: { port: 5173, proxy: apiProxy },
    preview: { port: 4173, proxy: apiProxy },
  };
});
