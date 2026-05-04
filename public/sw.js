const STATIC  = 'tabacaria-static-v2'
const DYNAMIC = 'tabacaria-dynamic-v2'
const API     = 'tabacaria-api-v2'

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC).then(c => c.addAll(['/', '/catalogo', '/offline']))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => ![STATIC, DYNAMIC, API].includes(k))
            .map(k  => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const { request: req } = e
  const url = new URL(req.url)

  // API produtos — network-first
  if (url.pathname.startsWith('/api/produtos')) {
    e.respondWith(
      fetch(req)
        .then(res => { caches.open(API).then(c => c.put(req, res.clone())); return res })
        .catch(() => caches.match(req))
    )
    return
  }

  // Páginas de produto — cache-first
  if (url.pathname.startsWith('/produto/')) {
    e.respondWith(
      caches.match(req).then(cached => {
        const fresh = fetch(req).then(res => {
          caches.open(DYNAMIC).then(c => c.put(req, res.clone()))
          return res
        })
        return cached ?? fresh
      })
    )
    return
  }

  // Assets — cache-first
  if (['image', 'font', 'style', 'script'].includes(req.destination)) {
    e.respondWith(caches.match(req).then(c => c ?? fetch(req)))
    return
  }

  // Demais — network + fallback /offline
  e.respondWith(fetch(req).catch(() => caches.match('/offline')))
})
