import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (/[@/]firebase[/\\]firestore|firebase[/\\]firestore/.test(id)) return 'firebase-firestore';
          if (/[@/]firebase[/\\]auth|firebase[/\\]auth/.test(id)) return 'firebase-auth';
          if (/[@/]firebase[/\\]storage|firebase[/\\]storage/.test(id)) return 'firebase-storage';
          if (id.includes('node_modules/@firebase') || id.includes('node_modules/firebase')) return 'firebase-core';
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'charts';
          if (id.includes('node_modules/lucide-react')) return 'icons';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react-vendor';
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Çeyiz Defterim',
        short_name: 'Çeyizim',
        description: 'Şevval ve Yusuf için çeyiz, bütçe ve hazırlık takip uygulaması.',
        theme_color: '#a85d6f',
        background_color: '#fbf7f5',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'tr',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
    }),
  ],
});

