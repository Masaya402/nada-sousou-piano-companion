import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoName = 'nada-sousou-piano-companion'
const isProd = process.env.NODE_ENV === 'production'   // build 時は production

// https://vitejs.dev/config/
export default defineConfig({
  base: isProd ? `/${repoName}/` : '/',   // dev(Preview) は '/', 本番は '/repo/'
  plugins: [react()],
})
