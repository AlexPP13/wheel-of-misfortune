/// <reference types="vitest/config" />

import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const certificateDirectory = fileURLToPath(new URL('./certs/', import.meta.url))

function getGithubPagesBase() {
  if (process.env.GITHUB_ACTIONS !== 'true') {
    return '/'
  }

  const repository = process.env.GITHUB_REPOSITORY?.split('/')[1]

  return repository ? `/${repository}/` : '/'
}

// https://vite.dev/config/
export default defineConfig({
  base: getGithubPagesBase(),
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['host.containers.internal'],
    https: {
      cert: readFileSync(`${certificateDirectory}dev-cert.pem`),
      key: readFileSync(`${certificateDirectory}dev-key.pem`),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
