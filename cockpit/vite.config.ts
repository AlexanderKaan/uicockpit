import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'UIcockpit — UI Kit Configurator',
        short_name: 'UIcockpit',
        description: 'Build a framework-neutral design system as a starting point for your app.',
        theme_color: '#151518',
        background_color: '#f4f5f8',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // Cache the app shell — instant 2nd visit
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // Network-first for the icon-library chunks so a redeploy can update them
        runtimeCaching: [
          {
            urlPattern: /assets\/(iconoir|lucide|phosphor|heroicons|X\.es).*\.js$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'cockpit-icon-libs' },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
