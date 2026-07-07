import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Honor a harness-assigned port (preview tools set PORT); default otherwise.
    port: Number(process.env.PORT) || 5173,
  },
})
