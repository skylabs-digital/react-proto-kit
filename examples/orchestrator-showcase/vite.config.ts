import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@skylabs-digital/react-proto-kit': path.resolve(__dirname, '../../src/index.ts'),
    },
  },
});
