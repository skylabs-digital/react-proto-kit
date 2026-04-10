import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

// QA sandbox: mounts react-proto-kit features directly against its source.
// Every scenario route exercises a concrete feature so agentic QA flows can
// navigate via Playwright MCP and inspect real behaviour without a backend.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@skylabs-digital/react-proto-kit': path.resolve(__dirname, '../../src/index.ts'),
    },
  },
  server: {
    port: 5180,
    strictPort: true,
  },
});
