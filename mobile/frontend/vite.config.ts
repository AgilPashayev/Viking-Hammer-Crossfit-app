import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Mobile frontend config — port 8080 for browser-based mobile testing
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    host: '0.0.0.0',
    strictPort: true,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
