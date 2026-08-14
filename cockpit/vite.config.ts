import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

// The version chips track the PUBLISHED packages — the concrete artifacts users
// install. Derived from their package.json at build time so they auto-sync on
// every deploy after a version bump; no hand-edited string to drift.
//
// BOTH of them, because there is no single "UIcockpit version": the site is
// continuously deployed and a kit is addressed by its own hash. A chip that
// showed one number for the whole product was claiming a thing that does not
// exist — and claiming it with the CLI's number, which at the time did not even
// contain the feature the site opened on.
const pkgVersion = (rel: string) =>
  JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8')).version as string
const cliVersion = pkgVersion('../cli/package.json')
const mcpVersion = pkgVersion('../mcp/package.json')

// The changelog lives at the repo root, where GitHub and npm expect it — which
// is outside Vite's root, so it cannot be `?raw` imported. Inlined at build
// time instead, the same way the versions are: one source file, no second copy
// inside the app to drift away from the first.
const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8')

export default defineConfig({
  define: {
    __UICOCKPIT_VERSION__: JSON.stringify(`v${cliVersion}`),
    __MCP_VERSION__: JSON.stringify(`v${mcpVersion}`),
    __CHANGELOG_MD__: JSON.stringify(changelog),
  },
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
