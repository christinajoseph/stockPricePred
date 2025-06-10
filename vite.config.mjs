import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // string shorthand: '/foo' -> 'http://localhost:4567/foo'
      // '/api': 'http://localhost:5000'
      
      // with options
      '/api': {
        target: 'http://localhost:5000', // Your Flask server
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '') // Optional: removes /api from the start of the request path
      }
    }
  }
})
