import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config — set dev server port to avoid collision with port 3000
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: 'localhost',
    strictPort: false,
  },
})
