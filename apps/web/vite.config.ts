import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    // Generates src/routeTree.gen.ts from the files in src/routes.
    // Must come before the React plugin.
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
  ],
  server: {
    port: 5173,
    // In dev, the Hono API runs separately on :3001. Vite forwards /api to it.
    proxy: { '/api': 'http://localhost:3001' },
  },
})
