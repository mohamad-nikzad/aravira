import { useEffect, useRef } from 'react'
import { ToastAction } from '@repo/ui/toast'
import { getActiveToasts, toast } from '@repo/ui/use-toast'

import { withPwaAssetVersion } from '#/lib/pwa-assets'

const RELOAD_FALLBACK_MS = 3_000

const ASSET_SCRIPT_PATTERN = /\/assets\/[a-zA-Z0-9_-]+\.js/

function extractAssetScript(html: string): string | null {
  const match = ASSET_SCRIPT_PATTERN.exec(html)
  return match ? match[0] : null
}

function getCurrentAssetScript(): string | null {
  for (const script of Array.from(document.scripts)) {
    const src = script.getAttribute('src') ?? ''
    const match = ASSET_SCRIPT_PATTERN.exec(src)
    if (match) {
      return match[0]
    }
  }
  return null
}

export function ServiceWorkerRegister() {
  const refreshingRef = useRef(false)
  const updateToastIdRef = useRef<string | null>(null)
  const appUpdateCheckInFlightRef = useRef(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return
    }

    if (!import.meta.env.PROD) {
      void (async () => {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(
          registrations.map((registration) => registration.unregister()),
        )

        if ('caches' in window) {
          const cacheNames = await window.caches.keys()
          await Promise.all(
            cacheNames.map((cacheName) => window.caches.delete(cacheName)),
          )
        }
      })()

      return
    }

    let registrationCleanup = () => {}
    let reloadFallbackTimer: number | null = null

    const cancelReloadFallback = () => {
      if (reloadFallbackTimer !== null) {
        window.clearTimeout(reloadFallbackTimer)
        reloadFallbackTimer = null
      }
    }

    const scheduleReloadFallback = () => {
      cancelReloadFallback()
      reloadFallbackTimer = window.setTimeout(() => {
        reloadFallbackTimer = null
        window.location.reload()
      }, RELOAD_FALLBACK_MS)
    }

    const releaseUpdatePrompt = (id: string) => {
      if (updateToastIdRef.current === id) {
        updateToastIdRef.current = null
      }
    }

    const promptForUpdate = (onUpdate: () => void) => {
      const activePromptId = updateToastIdRef.current
      if (activePromptId) {
        const stillVisible = getActiveToasts().some(
          (entry) => entry.id === activePromptId && entry.open !== false,
        )
        if (stillVisible) {
          return
        }
        updateToastIdRef.current = null
      }

      const updateToast = toast({
        duration: Infinity,
        title: 'نسخه جدید آماده است',
        description: 'برای دریافت آخرین تغییرات، برنامه را به روز کنید.',
        style: { touchAction: 'manipulation' },
        onOpenChange: (open) => {
          if (!open) {
            releaseUpdatePrompt(updateToast.id)
          }
        },
        action: (
          <ToastAction
            altText="Update app"
            onClick={() => {
              releaseUpdatePrompt(updateToast.id)
              updateToast.dismiss()
              onUpdate()
            }}
          >
            به روز رسانی
          </ToastAction>
        ),
      })

      updateToastIdRef.current = updateToast.id
    }

    const promptForServiceWorkerUpdate = (
      registration: ServiceWorkerRegistration,
    ) => {
      if (!registration.waiting) {
        return
      }

      promptForUpdate(() => {
        scheduleReloadFallback()
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
      })
    }

    const promptForAppShellUpdate = () => {
      promptForUpdate(() => {
        refreshingRef.current = true
        window.location.reload()
      })
    }

    const currentAssetScript = getCurrentAssetScript()

    const checkForAppShellUpdate = async () => {
      if (appUpdateCheckInFlightRef.current) {
        return
      }

      appUpdateCheckInFlightRef.current = true

      try {
        const response = await fetch('/', {
          cache: 'no-store',
          credentials: 'include',
          headers: {
            Accept: 'text/html',
            'Cache-Control': 'no-cache',
          },
        })

        if (
          !response.ok ||
          !response.headers.get('content-type')?.includes('text/html')
        ) {
          return
        }

        const nextMarkup = await response.text()
        const nextAssetScript = extractAssetScript(nextMarkup)

        if (
          currentAssetScript &&
          nextAssetScript &&
          currentAssetScript !== nextAssetScript
        ) {
          promptForAppShellUpdate()
        }
      } catch {
        /* ignore transient update check failures */
      } finally {
        appUpdateCheckInFlightRef.current = false
      }
    }

    const handleControllerChange = () => {
      if (refreshingRef.current) {
        return
      }

      refreshingRef.current = true
      cancelReloadFallback()
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      handleControllerChange,
    )

    navigator.serviceWorker
      .register(withPwaAssetVersion('/sw.js'), {
        scope: '/',
        updateViaCache: 'none',
      })
      .then((registration) => {
        const recheckForUpdates = () => {
          void checkForAppShellUpdate()
          void registration.update().then(() => {
            if (registration.waiting && navigator.serviceWorker.controller) {
              promptForServiceWorkerUpdate(registration)
            }
          })
        }

        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            recheckForUpdates()
          }
        }

        const handleUpdateFound = () => {
          const newWorker = registration.installing

          if (!newWorker) {
            return
          }

          const handleStateChange = () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              promptForServiceWorkerUpdate(registration)
            }
          }

          newWorker.addEventListener('statechange', handleStateChange)
        }

        if (registration.waiting && navigator.serviceWorker.controller) {
          promptForServiceWorkerUpdate(registration)
        }

        registration.addEventListener('updatefound', handleUpdateFound)
        window.addEventListener('focus', recheckForUpdates)
        document.addEventListener('visibilitychange', handleVisibilityChange)
        const updateInterval = window.setInterval(
          recheckForUpdates,
          10 * 60 * 1000,
        )
        recheckForUpdates()

        registrationCleanup = () => {
          registration.removeEventListener('updatefound', handleUpdateFound)
          window.removeEventListener('focus', recheckForUpdates)
          document.removeEventListener(
            'visibilitychange',
            handleVisibilityChange,
          )
          window.clearInterval(updateInterval)
        }
      })
      .catch(() => {})

    return () => {
      cancelReloadFallback()
      registrationCleanup()
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange,
      )
    }
  }, [])

  return null
}
