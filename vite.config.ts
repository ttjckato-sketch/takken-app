import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/takken-app/',
  build: {
    emptyOutDir: false
  },
  plugins: [
    react(),
    // 開発環境ではPWAを無効化
    /* process.env.NODE_ENV === 'production' ? VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: '宅建OS - 統合学習システム',
        short_name: '宅建OS',
        description: '記憶×理解のフル統合学習システム',
        theme_color: '#4f46e5',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    }) : null */
  ].filter(Boolean),
  server: {
    port: 5173
  }
})
