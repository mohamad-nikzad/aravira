'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { User, Service, SERVICE_CATEGORIES } from '@/lib/types'
import { cn } from '@/lib/utils'

interface StaffServicesDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: User | null
  services: Service[]
  onSuccess: () => void
}

export function StaffServicesDrawer({
  open,
  onOpenChange,
  staff,
  services,
  onSuccess,
}: StaffServicesDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unrestricted, setUnrestricted] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  const activeServices = useMemo(() => services.filter((s) => s.active), [services])

  const servicesByCategory = useMemo(() => {
    const acc: Record<string, Service[]> = {}
    for (const s of activeServices) {
      if (!acc[s.category]) acc[s.category] = []
      acc[s.category].push(s)
    }
    for (const k of Object.keys(acc)) {
      acc[k].sort((a, b) => a.name.localeCompare(b.name, 'fa'))
    }
    return acc
  }, [activeServices])

  useEffect(() => {
    if (!open || !staff) return
    setError('')
    const unres = staff.serviceIds == null
    setUnrestricted(unres)
    setSelected(new Set(staff.serviceIds ?? []))
  }, [open, staff])

  const toggleService = (serviceId: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(serviceId)
      else next.delete(serviceId)
      return next
    })
  }

  const handleUnrestrictedChange = (checked: boolean) => {
    setUnrestricted(checked)
    if (!checked && selected.size === 0 && activeServices.length > 0) {
      setSelected(new Set(activeServices.map((s) => s.id)))
    }
  }

  const handleSave = async () => {
    if (!staff) return
    setError('')
    if (!unrestricted && selected.size === 0) {
      setError('حداقل یک خدمت انتخاب کنید، یا حالت «همه خدمات» را فعال بگذارید.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/staff/${staff.id}/services`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          serviceIds: unrestricted ? null : [...selected],
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'ذخیره نشد')
        setLoading(false)
        return
      }
      onSuccess()
    } catch {
      setError('خطایی رخ داد')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setError('')
    onOpenChange(isOpen)
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="box-border flex min-h-0 max-h-[80vh] w-full flex-col overflow-hidden">
        <DrawerHeader className="shrink-0 text-start md:text-start">
          <DrawerTitle className="text-start">خدمات مجاز</DrawerTitle>
          <DrawerDescription className="text-start text-pretty leading-relaxed">
            {staff ? (
              <>
                <span className="font-medium text-foreground">{staff.name}</span>
                {' — '}
                مشخص کنید این پرسنل کدام خدمات را انجام می‌دهد. اگر محدودیتی نباشد، همه خدمات فعال
                برایشان در نوبت‌گیری در نظر گرفته می‌شود.
              </>
            ) : (
              'یک پرسنل را انتخاب کنید.'
            )}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-4 pb-1">
          <div className="flex w-full min-w-0 max-w-full flex-col gap-4">
            {/*
              Always stack (no side-by-side row): RTL + Switch dir="ltr" in a flex row
              causes min-width bugs and horizontal overflow on mobile.
            */}
            <div className="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="flex w-full min-w-0 max-w-full flex-col gap-3">
                <div className="w-full min-w-0 max-w-full space-y-1.5">
                  <p
                    className="text-sm font-medium leading-snug break-words"
                    id="staff-svc-unrestricted-label"
                  >
                    همه خدمات فعال
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed break-words">
                    اگر این گزینه روشن باشد، پرسنل می‌تواند هر خدمت فعال را انجام دهد. اگر خاموش باشد، فقط
                    خدمات تیک‌خورده مجاز است.
                  </p>
                </div>
                <div className="flex w-full min-w-0 justify-start pt-1" dir="rtl">
                  <div dir="ltr" className="inline-flex shrink-0">
                    <Switch
                      id="staff-svc-unrestricted"
                      aria-labelledby="staff-svc-unrestricted-label"
                      checked={unrestricted}
                      onCheckedChange={handleUnrestrictedChange}
                      disabled={!staff}
                    />
                  </div>
                </div>
              </div>
            </div>

            {!unrestricted && (
              <div className="flex w-full min-w-0 max-w-full flex-col gap-4 overflow-hidden rounded-lg border border-border/60 bg-muted/20 p-3">
                {Object.entries(servicesByCategory).map(([category, list]) => (
                  <div key={category} className="min-w-0">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {SERVICE_CATEGORIES[category as keyof typeof SERVICE_CATEGORIES]?.label ||
                        category}
                    </p>
                    <div className="flex flex-col gap-1">
                      {list.map((svc) => (
                        <label
                          key={svc.id}
                          className={cn(
                            'flex w-full min-w-0 cursor-pointer items-start gap-3 rounded-md px-2 py-2.5 text-sm transition-colors',
                            'hover:bg-accent/40'
                          )}
                        >
                          <span className="min-w-0 flex-1 leading-snug">
                            {svc.name}
                            <span className="text-muted-foreground text-xs"> · {svc.duration} دقیقه</span>
                          </span>
                          <Checkbox
                            className="mt-0.5 shrink-0"
                            checked={selected.has(svc.id)}
                            onCheckedChange={(v) => toggleService(svc.id, v === true)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && <FieldError>{error}</FieldError>}
          </div>
        </div>

        <DrawerFooter className="shrink-0 border-t border-border/60 bg-background">
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || !staff}
            className="touch-manipulation"
          >
            {loading && <Spinner className="ml-2" />}
            {loading ? 'در حال ذخیره...' : 'ذخیره'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" type="button">
              انصراف
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
