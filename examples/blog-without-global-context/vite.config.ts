import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Alias to use the local api-client-service
      'api-client-service': path.resolve(__dirname, '../../src/index.ts'),
    },
  },
  server: {
    port: 5174,
  },
});
