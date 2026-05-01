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
} from '@repo/ui/drawer'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Badge } from '@repo/ui/badge'
import { Field, FieldLabel, FieldGroup, FieldError } from '@repo/ui/field'
import { Spinner } from '@repo/ui/spinner'
import { Client } from '@repo/salon-core/types'
import { displayPhone, normalizePhone } from '@repo/salon-core/phone'
import { DataClientHttpError } from '@repo/data-client'
import { useManagerDataClient } from '@/components/manager-data-client-provider'

const tagOptions = ['VIP', 'حساسیت', 'رنگ خاص', 'نیاز به پیگیری', 'بدقول'] as const

interface ClientDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  onSuccess: () => void
}

export function ClientDrawer({
  open,
  onOpenChange,
  client,
  onSuccess,
}: ClientDrawerProps) {
  const dataClient = useManagerDataClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const isEditing = !!client

  useEffect(() => {
    if (open) {
      if (client) {
        setName(client.name)
        setPhone(client.phone ?? '')
        setNotes(client.notes || '')
        setTags(client.tags?.map((tag) => tag.label) ?? [])
      } else {
        setName('')
        setPhone('')
        setNotes('')
        setTags([])
      }
      setError('')
    }
  }, [open, client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (dataClient) {
        if (isEditing && client) {
          await dataClient.clients.update(client.id, {
            name,
            phone,
            notes: notes || undefined,
            tags,
          })
        } else {
          await dataClient.clients.create({
            name,
            phone,
            notes: notes || undefined,
            tags,
          })
        }
        void dataClient.sync.processPending()
        onSuccess()
        return
      }

      const url = isEditing ? `/api/clients/${client?.id}` : '/api/clients'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          phone,
          notes: notes || undefined,
          tags,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'ذخیره اطلاعات مشتری انجام نشد')
        setLoading(false)
        return
      }

      onSuccess()
    } catch (err) {
      if (dataClient && err instanceof DataClientHttpError) {
        setError(err.message)
      } else {
        setError('خطایی رخ داد. لطفاً دوباره تلاش کنید.')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (label: string) => {
    setTags((current) =>
      current.includes(label) ? current.filter((tag) => tag !== label) : [...current, label]
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEditing ? 'ویرایش مشتری' : 'مشتری جدید'}</DrawerTitle>
          <DrawerDescription>
            {isEditing ? 'اطلاعات مشتری را به‌روز کنید' : 'مشتری جدید به سالن اضافه کنید'}
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-auto px-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="client-name">نام</FieldLabel>
              <Input
                id="client-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نام مشتری"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="client-phone">شماره تماس</FieldLabel>
              <Input
                id="client-phone"
                type="tel"
                value={displayPhone(phone)}
                onChange={(e) => setPhone(normalizePhone(e.target.value))}
                placeholder="۰۹۱۲…"
                required
                dir="ltr"
                className="text-left tabular-nums"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="client-notes">یادداشت (اختیاری)</FieldLabel>
              <Input
                id="client-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="یادداشت درباره این مشتری…"
              />
            </Field>

            <Field>
              <FieldLabel>برچسب‌ها</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleTag(label)}
                    className="touch-manipulation"
                  >
                    <Badge
                      variant={tags.includes(label) ? 'default' : 'outline'}
                      className="px-2.5 py-1"
                    >
                      {label}
                    </Badge>
                  </button>
                ))}
              </div>
            </Field>

            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>
        </form>

        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={loading || !name || !phone} className="touch-manipulation">
            {loading && <Spinner className="ml-2" />}
            {loading ? 'در حال ذخیره…' : isEditing ? 'ذخیره تغییرات' : 'افزودن مشتری'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">انصراف</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
