import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_SHA__: JSON.stringify(
      (process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'dev').slice(0, 7),
    ),
    __BUILD_TIME__: JSON.stringify(
      process.env.VERCEL_BUILD_TIME || new Date().toISOString(),
    ),
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
