'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import { ArrowRight, Phone, CalendarPlus, Check, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Card, CardContent } from '@repo/ui/card'
import { Spinner } from '@repo/ui/spinner'
import { useAuth } from '@/components/auth-provider'
import type { FollowUpReason, RetentionItem } from '@repo/salon-core/types'
import { displayPhone } from '@repo/salon-core/phone'
import { toPersianDigits } from '@repo/salon-core/persian-digits'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json())

function reasonLabel(reason: FollowUpReason): string {
  switch (reason) {
    case 'inactive':
      return 'مراجعه قدیمی'
    case 'no-show':
      return 'غیبت'
    case 'new-client':
      return 'بدون نوبت دوم'
    case 'vip':
      return 'ارزشمند'
    case 'manual':
      return 'دستی'
    default:
      return reason
  }
}

export default function RetentionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (user && user.role !== 'manager') {
      router.replace('/calendar')
    }
  }, [user, router])

  const { data, isLoading, mutate } = useSWR<{ items: RetentionItem[] }>(
    user?.role === 'manager' ? '/api/retention' : null,
    fetcher
  )

  const items = data?.items ?? []

  const updateStatus = async (id: string, status: 'reviewed' | 'dismissed') => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/retention/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })
      if (res.ok) await mutate()
    } finally {
      setBusyId(null)
    }
  }

  if (!user || user.role !== 'manager') return null

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-start gap-3 border-b border-border/50 bg-card px-3 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          asChild
          className="h-10 w-10 shrink-0 rounded-2xl touch-manipulation"
        >
          <Link href="/settings" aria-label="بازگشت به بیشتر">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">پیگیری مشتریان</h1>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            لیست بر اساس داده واقعی نوبت‌ها ساخته می‌شود؛ پیام خودکار ارسال نمی‌شود.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">موردی در صف نیست.</p>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="border-border/50">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{item.client.name}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      <Phone className="me-1 inline h-3 w-3" />
                      {displayPhone(item.client.phone)}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {reasonLabel(item.reason)}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">{item.suggestedReason}</p>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                  <div>
                    <span className="block text-[10px]">آخرین مراجعه</span>
                    <span className="font-medium text-foreground" dir="ltr">
                      {item.lastVisitDate ? toPersianDigits(item.lastVisitDate) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px]">آخرین خدمت</span>
                    <span className="font-medium text-foreground">{item.lastServiceName ?? '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px]">مراجعات</span>
                    <span className="font-medium text-foreground" dir="ltr">
                      {new Intl.NumberFormat('fa-IR').format(item.completedCount)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px]">غیبت</span>
                    <span className="font-medium text-foreground" dir="ltr">
                      {new Intl.NumberFormat('fa-IR').format(item.noShowCount)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="touch-manipulation gap-1" asChild>
                    <a href={`tel:${item.client.phone}`}>
                      <Phone className="h-3.5 w-3.5" />
                      تماس
                    </a>
                  </Button>
                  <Button size="sm" variant="secondary" className="touch-manipulation gap-1" asChild>
                    <Link href={`/calendar?clientId=${item.client.id}`}>
                      <CalendarPlus className="h-3.5 w-3.5" />
                      نوبت
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    className="touch-manipulation gap-1"
                    disabled={busyId === item.id}
                    onClick={() => void updateStatus(item.id, 'reviewed')}
                  >
                    <Check className="h-3.5 w-3.5" />
                    بررسی شد
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="touch-manipulation gap-1 text-muted-foreground"
                    disabled={busyId === item.id}
                    onClick={() => void updateStatus(item.id, 'dismissed')}
                  >
                    <X className="h-3.5 w-3.5" />
                    رد
                  </Button>
                  <Button size="sm" variant="link" className="touch-manipulation px-0" asChild>
                    <Link href={`/clients/${item.client.id}`}>پروفایل</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
