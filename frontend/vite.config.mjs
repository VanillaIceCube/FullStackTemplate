import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env.HOST || 'localhost',
    port: 3000,
    strictPort: true,
    allowedHosts: ['fullstacktemplate.localhost'],
    watch: { usePolling: process.env.CHOKIDAR_USEPOLLING === 'true' },
  },
  build: { target: ['chrome117', 'edge121', 'firefox121', 'safari17'] },
  test: {
    clearMocks: true,
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    testTimeout: 15_000,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
