/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const API_URL = 'http://localhost:5080'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': API_URL } },
  preview: { port: 4173, proxy: { '/api': API_URL } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
})
