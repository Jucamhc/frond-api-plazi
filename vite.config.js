import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api_profile': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
