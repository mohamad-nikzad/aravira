'use client'

import { useEffect, useRef } from 'react'
import { ToastAction } from '@repo/ui/toast'
import { toast } from '@repo/ui/use-toast'

const NEXT_BUILD_ID_PATTERN = /"b":"([^"]+)"/

function getBuildIdFromMarkup(markup: string) {
  return markup.match(NEXT_BUILD_ID_PATTERN)?.[1] ?? null
}

function getCurrentBuildId() {
  for (const script of Array.from(document.scripts)) {
    const buildId = getBuildIdFromMarkup(script.textContent ?? '')
    if (buildId) {
      return buildId
    }
  }

  return null
}

function getAssetSignatureFromDocument(documentToRead: Document) {
  return Array.from(
    documentToRead.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
      'script[src^="/_next/static/"], link[href^="/_next/static/"]'
    )
  )
    .map((element) => {
      if (element instanceof HTMLScriptElement) {
        return element.src
      }

      return element.href
    })
    .sort()
    .join('|')
}

function getCurrentAssetSignature() {
  return getAssetSignatureFromDocument(document)
}

function getAssetSignatureFromMarkup(markup: string) {
  return getAssetSignatureFromDocument(
    new DOMParser().parseFromString(markup, 'text/html')
  )
}

export function ServiceWorkerRegister() {
  const refreshingRef = useRef(false)
  const updateToastIdRef = useRef<string | null>(null)
  const appUpdateCheckInFlightRef = useRef(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return
    }

    if (process.env.NODE_ENV !== 'production') {
      void (async () => {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((registration) => registration.unregister()))

        if ('caches' in window) {
          const cacheNames = await window.caches.keys()
          await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)))
        }
      })()

      return
    }

    let registrationCleanup = () => {}

    const promptForUpdate = (onUpdate: () => void) => {
      if (updateToastIdRef.current) {
        return
      }

      let toastId = ''
      const updateToast = toast({
        duration: Infinity,
        title: 'نسخه جدید آماده است',
        description: 'برای دریافت آخرین تغییرات، برنامه را به روز کنید.',
        onOpenChange: (open) => {
          if (!open && updateToastIdRef.current === toastId) {
            updateToastIdRef.current = null
          }
        },
        action: (
          <ToastAction
            altText="Update app"
            onClick={() => {
              updateToast.dismiss()
              onUpdate()
            }}
          >
            به روز رسانی
          </ToastAction>
        ),
      })

      toastId = updateToast.id
      updateToastIdRef.current = toastId
    }

    const promptForServiceWorkerUpdate = (
      registration: ServiceWorkerRegistration
    ) => {
      if (!registration.waiting) {
        return
      }

      promptForUpdate(() => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
      })
    }

    const promptForAppShellUpdate = () => {
      promptForUpdate(() => {
        refreshingRef.current = true
        window.location.reload()
      })
    }

    const checkForAppShellUpdate = async () => {
      if (appUpdateCheckInFlightRef.current) {
        return
      }

      appUpdateCheckInFlightRef.current = true

      try {
        const response = await fetch(
          `${window.location.pathname}${window.location.search}`,
          {
            cache: 'no-store',
            credentials: 'include',
            headers: {
              Accept: 'text/html',
              'Cache-Control': 'no-cache',
            },
          }
        )

        if (
          !response.ok ||
          !response.headers.get('content-type')?.includes('text/html')
        ) {
          return
        }

        const nextMarkup = await response.text()
        const currentBuildId = getCurrentBuildId()
        const nextBuildId = getBuildIdFromMarkup(nextMarkup)

        if (currentBuildId && nextBuildId) {
          if (currentBuildId !== nextBuildId) {
            promptForAppShellUpdate()
          }

          return
        }

        const currentAssetSignature = getCurrentAssetSignature()
        const nextAssetSignature = getAssetSignatureFromMarkup(nextMarkup)

        if (
          currentAssetSignature &&
          nextAssetSignature &&
          currentAssetSignature !== nextAssetSignature
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
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
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
        const updateInterval = window.setInterval(recheckForUpdates, 10 * 60 * 1000)
        recheckForUpdates()

        registrationCleanup = () => {
          registration.removeEventListener('updatefound', handleUpdateFound)
          window.removeEventListener('focus', recheckForUpdates)
          document.removeEventListener('visibilitychange', handleVisibilityChange)
          window.clearInterval(updateInterval)
        }
      })
      .catch(() => {})

    return () => {
      registrationCleanup()
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange
      )
    }
  }, [])

  return null
}
