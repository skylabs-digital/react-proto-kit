import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Different port to avoid conflicts
    host: '0.0.0.0', // Bind to all interfaces for IP access testing
  },
})
