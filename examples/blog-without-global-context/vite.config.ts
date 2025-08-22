import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Alias to use the local react-proto-kit
      '@skylabs-digital/react-proto-kit': path.resolve(__dirname, '../../src/index.ts'),
    },
  },
  server: {
    port: 5174,
  },
});
