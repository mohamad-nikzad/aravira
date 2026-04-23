'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Switch } from '@repo/ui/switch'
import { useToast } from '@repo/ui/use-toast'
import { Badge } from '@repo/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function StaffPushSettings() {
  const { toast } = useToast()
  const [isSupported, setIsSupported] = useState(false)
  const [serverReady, setServerReady] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    setIsSupported(supported)
    if (supported) {
      setPermission(Notification.permission)
    }

    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/push/config', { credentials: 'include' })
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { configured?: boolean; publicKey?: string | null }
        if (data.configured && data.publicKey) {
          setServerReady(true)
          setPublicKey(data.publicKey)
        }
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const syncBrowserSubscription = useCallback(async () => {
    if (
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !('Notification' in window)
    ) {
      return
    }

    setPermission(Notification.permission)
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    setEnabled(!!sub)
    if (sub && serverReady && publicKey) {
      const json = sub.toJSON()
      if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            subscription: {
              endpoint: json.endpoint,
              keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
            },
          }),
        })
      }
    }
  }, [serverReady, publicKey])

  useEffect(() => {
    if (!serverReady || !isSupported) return
    void syncBrowserSubscription()
  }, [isSupported, serverReady, syncBrowserSubscription])

  useEffect(() => {
    if (!serverReady || !isSupported) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncBrowserSubscription()
      }
    }

    window.addEventListener('focus', handleVisibilityChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleVisibilityChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isSupported, serverReady, syncBrowserSubscription])

  const handleToggle = async (next: boolean) => {
    if (!publicKey || busy) return
    setBusy(true)
    try {
      if (
        !('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        !('Notification' in window)
      ) {
        toast({
          title: 'پشتیبانی نمی‌شود',
          description: 'مرورگر یا دستگاه شما اعلان فشاری را پشتیبانی نمی‌کند.',
          variant: 'destructive',
        })
        return
      }

      if (Notification.permission === 'denied' && next) {
        toast({
          title: 'اجازه اعلان مسدود است',
          description: 'اجازه اعلان را از تنظیمات مرورگر یا دستگاه دوباره فعال کنید.',
          variant: 'destructive',
        })
        return
      }

      const reg = await navigator.serviceWorker.ready

      if (!next) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          const endpoint = sub.endpoint
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ endpoint }),
          })
          await sub.unsubscribe()
        }
        setEnabled(false)
        toast({ title: 'اعلان خاموش شد' })
        return
      }

      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        toast({
          title: 'اجازه داده نشد',
          description: 'برای دریافت اعلان، باید اجازه را در مرورگر بدهید.',
          variant: 'destructive',
        })
        return
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      const json = sub.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('Invalid subscription')
      }

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subscription: {
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          },
        }),
      })

      if (!res.ok) {
        await sub.unsubscribe().catch(() => {})
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'subscribe failed')
      }

      setEnabled(true)
      toast({
        title: 'اعلان فعال شد',
        description: 'وقتی مدیر برای شما نوبت ثبت کند، اعلان دریافت می‌کنید.',
      })
    } catch (e) {
      console.error(e)
      toast({
        title: 'خطا',
        description: 'فعال‌سازی اعلان انجام نشد. دوباره تلاش کنید.',
        variant: 'destructive',
      })
      setEnabled(false)
    } finally {
      setBusy(false)
    }
  }

  const status = !serverReady
    ? { label: 'سرور آماده نیست', tone: 'secondary' as const }
    : !isSupported
      ? { label: 'این دستگاه پشتیبانی نمی‌کند', tone: 'secondary' as const }
      : enabled
        ? { label: 'فعال', tone: 'default' as const }
        : permission === 'denied'
          ? { label: 'اجازه مسدود شده', tone: 'destructive' as const }
          : { label: 'غیرفعال', tone: 'secondary' as const }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">اعلان نوبت</CardTitle>
          <Badge variant={status.tone === 'default' ? 'default' : 'secondary'}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Bell className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-medium">نوبت جدید از طرف مدیر</p>
              <p className="text-xs text-muted-foreground leading-snug">
                با نصب برنامه روی صفحهٔ اصلی و روشن بودن این گزینه، وقتی مدیر برای شما نوبت بگذارد
                اعلان می‌گیرید.
              </p>
            </div>
          </div>
          <Switch
            checked={enabled}
            disabled={busy || !serverReady || !isSupported}
            onCheckedChange={(v) => void handleToggle(v)}
            className="shrink-0"
          />
        </div>

        {!serverReady ? (
          <Alert className="border-border/60 bg-muted/40">
            <Bell className="h-4 w-4" />
            <AlertTitle>اعلان برای این سرور هنوز پیکربندی نشده است</AlertTitle>
            <AlertDescription>
              تا وقتی کلیدهای اعلان روی سرور تنظیم نشوند، این گزینه فعال نخواهد شد.
            </AlertDescription>
          </Alert>
        ) : null}

        {serverReady && !isSupported ? (
          <Alert className="border-border/60 bg-muted/40">
            <Bell className="h-4 w-4" />
            <AlertTitle>اعلان روی این دستگاه در دسترس نیست</AlertTitle>
            <AlertDescription>
              مرورگر فعلی از Push Notification پشتیبانی نمی‌کند. Chrome یا Safari نصب‌شده را امتحان کنید.
            </AlertDescription>
          </Alert>
        ) : null}

        {serverReady && isSupported && permission === 'denied' ? (
          <Alert variant="destructive">
            <Bell className="h-4 w-4" />
            <AlertTitle>اجازه اعلان مسدود شده است</AlertTitle>
            <AlertDescription>
              برای دریافت نوبت‌های جدید، اجازه اعلان را از تنظیمات مرورگر یا دستگاه دوباره فعال کنید.
            </AlertDescription>
          </Alert>
        ) : null}

        {serverReady && isSupported && permission !== 'denied' && !enabled ? (
          <Alert className="border-primary/20 bg-primary/5">
            <Bell className="h-4 w-4 text-primary" />
            <AlertTitle>هنوز اشتراک اعلان ثبت نشده است</AlertTitle>
            <AlertDescription>
              پس از روشن کردن این گزینه، اعلان‌های نوبت جدید شما را مستقیم به همان روز در تقویم می‌برند.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}
