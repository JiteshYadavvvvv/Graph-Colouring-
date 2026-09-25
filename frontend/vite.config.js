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

// A backend on the developer's own machine. In a deployed site this would
// make every visitor's browser call its own computer.
const LOOPBACK = /^https?:\/\/(localhost|127(\.\d{1,3}){3}|0\.0\.0\.0|\[::1\])(:\d+)?(\/|$)/i;

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    // loadEnv also picks up VITE_API_URL from the shell or hosting environment.
    const apiUrl = (loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL ?? '').trim();
    if (!apiUrl) {
      // A deployed static site has no proxy: without VITE_API_URL the built app
      // would call /api on its own host and get 404s. Say so in the build log.
      console.warn(
        '\n[config] VITE_API_URL is not set for this build. The app will call /api on its own origin,\n' +
          '         which only works behind a proxy (e.g. `npm run preview`). Set it to the FastAPI origin.\n',
      );
    } else if (mode === 'production' && LOOPBACK.test(apiUrl)) {
      // Refuse instead of warning: this mistake would ship a broken site.
      throw new Error(
        `[config] VITE_API_URL is ${apiUrl}, a local address. A production build must point at the ` +
          'deployed FastAPI backend. For a local test build use another mode, e.g. `vite build --mode localtest`.',
      );
    } else if (mode === 'production' && apiUrl.startsWith('http://')) {
      console.warn(`\n[config] VITE_API_URL uses plain http (${apiUrl}); browsers block it on an https site.\n`);
    }
  }
  return {
    plugins: [react()],
    server: { port: 5173, proxy: apiProxy },
    preview: { port: 4173, proxy: apiProxy },
    build: {
      rolldownOptions: {
        output: {
          // Libraries change less often than the app, so they get their own
          // cacheable chunk; so does the (large, static) map geometry.
          codeSplitting: {
            groups: [
              { name: 'vendor', test: /node_modules/ },
              { name: 'india-geometry', test: /indiaGeometry/ },
            ],
          },
        },
      },
    },
  };
});
