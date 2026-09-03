import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages는 https://<계정>.github.io/Blokus/ 처럼 하위 경로로 서비스되므로
// 그때만 base를 저장소 이름으로 바꾼다. Vercel·Netlify나 로컬에서는 루트 그대로.
const base = process.env.GITHUB_PAGES === 'true' ? '/Blokus/' : '/'

export default defineConfig({
  base,
  plugins: [react()],
  server: { port: 5180 },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
