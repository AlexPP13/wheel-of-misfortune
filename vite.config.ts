import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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
})
