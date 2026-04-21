'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Switch } from '@repo/ui/switch'
import { useToast } from '@repo/ui/use-toast'

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
  const [serverReady, setServerReady] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
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
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }
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
    if (!serverReady) return
    void syncBrowserSubscription()
  }, [serverReady, syncBrowserSubscription])

  const handleToggle = async (next: boolean) => {
    if (!publicKey || busy) return
    setBusy(true)
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        toast({
          title: 'پشتیبانی نمی‌شود',
          description: 'مرورگر یا دستگاه شما اعلان فشاری را پشتیبانی نمی‌کند.',
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

  if (!serverReady) {
    return null
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">اعلان نوبت</CardTitle>
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
            disabled={busy}
            onCheckedChange={(v) => void handleToggle(v)}
            className="shrink-0"
          />
        </div>
      </CardContent>
    </Card>
  )
}
