'use client'

import { useEffect, useRef } from 'react'
import { ToastAction } from '@/components/ui/toast'
import { toast } from '@/hooks/use-toast'

export function ServiceWorkerRegister() {
  const refreshingRef = useRef(false)
  const updateToastIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
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
      .register('/sw.js', { scope: '/' })
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
        recheckForUpdates()

        registrationCleanup = () => {
          registration.removeEventListener('updatefound', handleUpdateFound)
          window.removeEventListener('focus', recheckForUpdates)
          document.removeEventListener('visibilitychange', handleVisibilityChange)
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
