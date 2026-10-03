import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';

// Ayarlar'ın altında görünen sürüm: commit kısaltması + derleme zamanı (İstanbul)
let commit = 'yerel';
try {
  commit = execSync('git rev-parse --short HEAD').toString().trim();
} catch {}
const zaman = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

// GitHub Pages adresi: https://lumadigitale.github.io/cashluma/
export default defineConfig({
  base: '/cashluma/',
  define: { __SURUM__: JSON.stringify(`${commit} · ${zaman}`) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // kaydı main.jsx yapıyor: uygulama her öne geldiğinde güncelleme kontrolü
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Cashluma',
        short_name: 'Cashluma',
        description: 'Gelir, gider ve harcama paneli',
        lang: 'tr',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Apps Script çağrıları önbelleğe alınmaz; uygulama kendi verisini localStorage'da tutar.
        navigateFallback: 'index.html',
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Outfit fontu bir kez inince internet olmadan da kullanılsın
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: { cacheName: 'fontlar', expiration: { maxEntries: 20, maxAgeSeconds: 31536000 } },
          },
        ],
      },
    }),
  ],
});
