'use client'

import { useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldGroup, FieldError } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Service, SERVICE_CATEGORIES, STAFF_COLORS } from '@/lib/types'

interface ServiceDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: Service | null
  onSuccess: () => void
}

export function ServiceDrawer({
  open,
  onOpenChange,
  service,
  onSuccess,
}: ServiceDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [category, setCategory] = useState<keyof typeof SERVICE_CATEGORIES>('hair')
  const [duration, setDuration] = useState(45)
  const [price, setPrice] = useState(0)
  const [color, setColor] = useState<string>(STAFF_COLORS[0])
  const [active, setActive] = useState(true)

  const isEditing = !!service

  useEffect(() => {
    if (!open) return
    if (service) {
      setName(service.name)
      setCategory(service.category)
      setDuration(service.duration)
      setPrice(service.price)
      setColor(service.color)
      setActive(service.active)
    } else {
      setName('')
      setCategory('hair')
      setDuration(45)
      setPrice(0)
      setColor(STAFF_COLORS[0])
      setActive(true)
    }
    setError('')
  }, [open, service])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isEditing) {
        const res = await fetch(`/api/services/${service.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name,
            category,
            duration,
            price,
            color,
            active,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'ذخیره نشد')
          setLoading(false)
          return
        }
      } else {
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name,
            category,
            duration,
            price,
            color,
            active,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'افزودن نشد')
          setLoading(false)
          return
        }
      }
      onSuccess()
    } catch {
      setError('خطایی رخ داد')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEditing ? 'ویرایش خدمت' : 'خدمت جدید'}</DrawerTitle>
          <DrawerDescription>نام، مدت و قیمت را مشخص کنید</DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-auto px-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="svc-name">نام خدمت</FieldLabel>
              <Input
                id="svc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel>دسته</FieldLabel>
              <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SERVICE_CATEGORIES) as (keyof typeof SERVICE_CATEGORIES)[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {SERVICE_CATEGORIES[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="svc-dur">مدت (دقیقه)</FieldLabel>
                <Input
                  id="svc-dur"
                  type="number"
                  min={5}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  dir="ltr"
                  className="text-left"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="svc-price">قیمت (تومان)</FieldLabel>
                <Input
                  id="svc-price"
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  dir="ltr"
                  className="text-left"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel>رنگ در تقویم</FieldLabel>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_COLORS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.replace('bg-', '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {isEditing && (
              <Field>
                <FieldLabel>وضعیت</FieldLabel>
                <Select
                  value={active ? 'on' : 'off'}
                  onValueChange={(v) => setActive(v === 'on')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on">فعال</SelectItem>
                    <SelectItem value="off">غیرفعال</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>
        </form>

        <DrawerFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading || !name}
            className="touch-manipulation"
          >
            {loading && <Spinner className="ml-2" />}
            {loading ? '...' : isEditing ? 'ذخیره' : 'افزودن'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">انصراف</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
