--- START OF FILE vite.config.ts ---

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // CRITICAL CHANGE: This must match your repository name exactly, surrounded by slashes.
  base: '/Graphite-Git/', 
})
