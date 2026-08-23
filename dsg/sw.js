/* THE OLD SITE'S UNDERTAKER.
 *
 * The previous uicockpit.com registered a Workbox service worker that
 * precached the whole site, so every returning visitor kept seeing the
 * retired product from their own disk. This file ships at the same URL and
 * replaces that worker on its next update check: it unregisters itself,
 * drops every cache, and reloads open tabs onto the real network. When no
 * visitor has the old worker any more, this file can be deleted; a 404 on
 * sw.js unregisters stragglers too. */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.map((k) => caches.delete(k)))
    await self.registration.unregister()
    const tabs = await self.clients.matchAll({ type: 'window' })
    tabs.forEach((t) => t.navigate(t.url))
  })())
})
