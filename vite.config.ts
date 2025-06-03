import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Only expose necessary environment variables to the client
  const clientEnv = {
    VITE_API_URL: env.VITE_API_URL || 'http://localhost:3001',
    VITE_OPENROUTER_API_KEY: env.OPENROUTER_API_KEY,
    VITE_FIREBASE_API_KEY: env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: env.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: env.VITE_FIREBASE_APP_ID,
    VITE_FIREBASE_MEASUREMENT_ID: env.VITE_FIREBASE_MEASUREMENT_ID,
  }

  return {
    plugins: [react()],
    base: '/',
    server: {
      host: true,
      port: 5173,
      strictPort: true
    },
    preview: {
      allowedHosts: ['private-llm.onrender.com', 'localhost'],
      port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
      host: '0.0.0.0'
    },
    define: {
      'process.env': clientEnv
    }
  }
})
