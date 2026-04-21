import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import istanbul from 'vite-plugin-istanbul'

export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    react(),
    istanbul({
      include: 'src/*',
      exclude: ['node_modules', 'e2e'],
      extension: ['.ts', '.tsx'],
      requireEnv: true,
    }),
  ],
})
