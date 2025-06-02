import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/localLLM/',
  preview: {
    allowedHosts: ['localllm.onrender.com', 'localhost'],
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    host: '0.0.0.0'
  }
})
