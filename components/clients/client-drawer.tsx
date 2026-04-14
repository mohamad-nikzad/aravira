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
import { Spinner } from '@/components/ui/spinner'
import { Client } from '@/lib/types'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  const isEditing = !!client

  useEffect(() => {
    if (open) {
      if (client) {
        setName(client.name)
        setPhone(client.phone)
        setNotes(client.notes || '')
      } else {
        setName('')
        setPhone('')
        setNotes('')
      }
      setError('')
    }
  }, [open, client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = isEditing ? `/api/clients/${client.id}` : '/api/clients'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          phone,
          notes: notes || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'ذخیره اطلاعات مشتری انجام نشد')
        setLoading(false)
        return
      }

      onSuccess()
    } catch {
      setError('خطایی رخ داد. لطفاً دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="۰۹۱۲..."
                required
                dir="ltr"
                className="text-left"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="client-notes">یادداشت (اختیاری)</FieldLabel>
              <Input
                id="client-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="یادداشت درباره این مشتری..."
              />
            </Field>

            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>
        </form>

        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={loading || !name || !phone} className="touch-manipulation">
            {loading && <Spinner className="ml-2" />}
            {loading ? 'در حال ذخیره...' : isEditing ? 'ذخیره تغییرات' : 'افزودن مشتری'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">انصراف</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
