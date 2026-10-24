
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    base: '/Kash5a/',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'serve-root-pwa-assets',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (
              req.url === '/manifest.json' ||
              req.url === '/sw.js' ||
              req.url?.startsWith('/pwa-') ||
              req.url === '/favicon.ico' ||
              req.url === '/favicon.png' ||
              req.url === '/apple-touch-icon.png' ||
              req.url === '/logo.jpg' ||
              req.url === '/logo.png'
            ) {
              req.url = '/Kash5a' + req.url;
            }
            next();
          });
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'favicon.png',
          'apple-touch-icon.png',
        ],
        manifest: false,
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Keep AI Studio file watching behavior unchanged.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
