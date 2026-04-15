const CACHE_NAME = 'aravira-v3'

const PRECACHE_ASSETS = [
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) return

  // Static assets: cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf|eot)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // HTML navigations: network-first, cache only as offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached
          return new Response(
            '<!DOCTYPE html><html dir="rtl" lang="fa"><body style="font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f8f5f2;color:#2D1F1A"><div style="text-align:center"><h1>آفلاین</h1><p>لطفا اتصال اینترنت خود را بررسی کنید</p></div></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          )
        })
      })
    )
    return
  }
})
