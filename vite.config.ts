import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// import ghpages from 'vite-plugin-gh-pages'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  //TODO fix env prefix
  //envPrefix: "BUBBLES_",
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    // ghpages({
    //   branch: 'main',
    //   message: 'Deploy to GitHub Pages',
    // }),
  ],
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
})
