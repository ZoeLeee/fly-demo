import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isDev = process.env.NODE_ENV === 'development'

const base = !isDev ? "/fly-demo" : "/"

// https://vitejs.dev/config/
export default defineConfig({
  base: base,
  plugins: [react()],
  define: {
    "BASE_URL": JSON.stringify(isDev ? "" : base)
  },
  build: {
    target: ['edge90', 'chrome90', 'firefox90', 'safari15']
  }
})
