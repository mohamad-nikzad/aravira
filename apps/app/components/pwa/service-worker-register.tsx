'use client'

import { useEffect, useRef } from 'react'
import { ToastAction } from '@repo/ui/toast'
import { toast } from '@repo/ui/use-toast'

export function ServiceWorkerRegister() {
  const refreshingRef = useRef(false)
  const updateToastIdRef = useRef<string | null>(null)

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

    const promptForUpdate = (registration: ServiceWorkerRegistration) => {
      if (!registration.waiting || updateToastIdRef.current) {
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
              registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
            }}
          >
            به روز رسانی
          </ToastAction>
        ),
      })

      toastId = updateToast.id
      updateToastIdRef.current = toastId
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
          void registration.update().then(() => {
            if (registration.waiting && navigator.serviceWorker.controller) {
              promptForUpdate(registration)
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
              promptForUpdate(registration)
            }
          }

          newWorker.addEventListener('statechange', handleStateChange)
        }

        if (registration.waiting && navigator.serviceWorker.controller) {
          promptForUpdate(registration)
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
