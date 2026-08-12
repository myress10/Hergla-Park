import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Split vendor chunks — Vite 8 / Rolldown requires manualChunks as a function
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('three') || id.includes('@react-three')) {
            return 'three-vendor';
          }
          if (id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'react-vendor';
          }
        },
      },
    },
    // three.js is inherently ~1MB and cannot be split further without lazy-loading
    chunkSizeWarningLimit: 1100,
  },
})

