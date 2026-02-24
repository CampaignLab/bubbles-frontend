import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// import ghpages from 'vite-plugin-gh-pages'

import { mockApiPlugin } from './api/mockPlugin'

// https://vite.dev/config/
export default defineConfig(() => {
  // You can toggle this to false if you are running a separate Python/Node backend
  const useMockApi = process.env.VITE_USE_MOCK_API !== 'false'

  return {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Server configuration for development
    server: {
      proxy: !useMockApi ? {
        // Example: If you have a real backend at localhost:3001
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        }
      } : undefined
    },
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
      // Simple redirect for local dev: root (/) -> base (/bubbles-frontend/)
      {
        name: 'base-redirect',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Check if the request is for the root or index.html
            const url = req.url || '';
            const isRoot = url === '/' || url.startsWith('/?') || url === '/index.html';

            if (isRoot) {
              const query = url.includes('?') ? url.substring(url.indexOf('?')) : '';
              console.log('[Dev Server] Redirecting root to /bubbles-frontend/' + query);
              res.writeHead(301, { Location: '/bubbles-frontend/' + query });
              res.end();
            } else {
              next();
            }
          });
        }
      },
      // Mock API: Active in dev/preview unless explicitly disabled
      useMockApi && mockApiPlugin(),
    ].filter(Boolean),
    base: '/bubbles-frontend/',
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('maplibre-gl') || id.includes('react-map-gl')) {
              return 'maplibre-vendor';
            }
          },
        },
      },
    },
  }
})
