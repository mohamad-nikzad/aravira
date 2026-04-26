const SW_VERSION = '2026-04-26-v1'
const STATIC_CACHE_NAME = `aravira-static-${SW_VERSION}`
const NAVIGATION_CACHE_NAME = `aravira-pages-${SW_VERSION}`
const MEDIA_CACHE_NAME = `aravira-media-${SW_VERSION}`
const CACHE_NAMES = [
  STATIC_CACHE_NAME,
  NAVIGATION_CACHE_NAME,
  MEDIA_CACHE_NAME,
]

const PRECACHE_ASSETS = [
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/logo.png',
]

function isSameOrigin(url) {
  return url.origin === self.location.origin
}

function isStaticMediaRequest(request, url) {
  return (
    isSameOrigin(url) &&
    (request.destination === 'image' ||
      request.destination === 'font' ||
      url.pathname.startsWith('/icons/') ||
      url.pathname.startsWith('/landing/'))
  )
}

function shouldCacheNavigation(pathname) {
  return (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/today') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/retention') ||
    pathname.startsWith('/staff')
  )
}

function getRouteLabel(pathname) {
  if (pathname.startsWith('/calendar')) return 'تقویم'
  if (pathname.startsWith('/today')) return 'امروز'
  if (pathname.startsWith('/clients/')) return 'پروفایل مشتری'
  if (pathname.startsWith('/clients')) return 'مشتریان'
  if (pathname.startsWith('/dashboard')) return 'داشبورد'
  if (pathname.startsWith('/settings')) return 'تنظیمات'
  if (pathname.startsWith('/retention')) return 'پیگیری'
  if (pathname.startsWith('/staff')) return 'پرسنل'
  if (pathname.startsWith('/login')) return 'ورود'
  if (pathname.startsWith('/signup')) return 'ثبت‌نام'
  return 'سالورا'
}

function createOfflineDocument(pathname) {
  const routeLabel = getRouteLabel(pathname)

  return new Response(
    `<!DOCTYPE html>
<html dir="rtl" lang="fa">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${routeLabel} - آفلاین</title>
    <style>
      :root {
        color-scheme: light;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f8eff0;
        color: #6b3a4a;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background:
          radial-gradient(circle at top, rgba(189, 92, 110, 0.12), transparent 45%),
          #f8eff0;
      }
      .card {
        width: min(100%, 420px);
        border-radius: 24px;
        border: 1px solid rgba(107, 58, 74, 0.12);
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 18px 40px rgba(107, 58, 74, 0.1);
        padding: 24px;
        text-align: right;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 1.2rem;
      }
      p {
        margin: 0;
        line-height: 1.8;
        color: rgba(107, 58, 74, 0.78);
      }
      button {
        margin-top: 18px;
        border: 0;
        border-radius: 16px;
        background: #6b3a4a;
        color: white;
        font: inherit;
        padding: 12px 18px;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>${routeLabel} الان به اینترنت نیاز دارد</h1>
      <p>اگر قبلا این صفحه را باز کرده باشید، نسخه ذخیره شده به محض برگشت اینترنت دوباره همگام می‌شود.</p>
      <button type="button" onclick="window.location.reload()">تلاش دوباره</button>
    </main>
  </body>
</html>`,
    {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE_NAME)
      await cache.addAll(PRECACHE_ASSETS)
    })()
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names
          .filter((name) => !CACHE_NAMES.includes(name))
          .map((name) => caches.delete(name))
      )
      await self.clients.claim()
    })()
  )
})

self.addEventListener('push', (event) => {
  let payload = { title: 'سالورا', body: '', url: '/calendar', tag: 'general' }
  try {
    if (event.data) {
      const parsed = event.data.json()
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.title === 'string') payload.title = parsed.title
        if (typeof parsed.body === 'string') payload.body = parsed.body
        if (typeof parsed.url === 'string') payload.url = parsed.url
        if (typeof parsed.tag === 'string') payload.tag = parsed.tag
      }
    }
  } catch (_) {
    /* ignore */
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: payload.tag,
      data: { url: payload.url, tag: payload.tag },
      lang: 'fa',
      dir: 'rtl',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/calendar'
  const url = new URL(targetUrl, self.location.origin).href

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(async (clientList) => {
        for (const client of clientList) {
          if (!client.url.startsWith(self.location.origin) || !('focus' in client)) {
            continue
          }

          if ('navigate' in client) {
            await client.navigate(url)
          }

          return client.focus()
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(url)
        }
      })
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const navigationCache = await caches.open(NAVIGATION_CACHE_NAME)

        try {
          const response = await fetch(request)

          if (
            response.ok &&
            shouldCacheNavigation(url.pathname) &&
            response.headers.get('content-type')?.includes('text/html')
          ) {
            await navigationCache.put(request, response.clone())
          }

          return response
        } catch {
          const cached = await navigationCache.match(request)
          return cached ?? createOfflineDocument(url.pathname)
        }
      })()
    )
    return
  }

  if (isStaticMediaRequest(request, url)) {
    event.respondWith(
      (async () => {
        const mediaCache = await caches.open(MEDIA_CACHE_NAME)
        const cached = await mediaCache.match(request)
        const networkResponsePromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              void mediaCache.put(request, response.clone())
            }
            return response
          })
          .catch(() => null)

        if (cached) {
          void networkResponsePromise
          return cached
        }

        const networkResponse = await networkResponsePromise
        if (networkResponse) {
          return networkResponse
        }

        return (
          (await caches.match(request)) ||
          new Response(null, { status: 504, statusText: 'Offline' })
        )
      })()
    )
  }
})
