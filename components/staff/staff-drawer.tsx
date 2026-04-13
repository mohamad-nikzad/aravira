'use client'

import { useState } from 'react'
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

interface StaffDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function StaffDrawer({
  open,
  onOpenChange,
  onSuccess,
}: StaffDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'staff' | 'manager'>('staff')

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setName('')
      setEmail('')
      setPassword('')
      setPhone('')
      setRole('staff')
      setError('')
    }
    onOpenChange(isOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          email,
          password,
          phone: phone || undefined,
          role,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'افزودن پرسنل انجام نشد')
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
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>پرسنل جدید</DrawerTitle>
          <DrawerDescription>
            عضو جدیدی به تیم سالن اضافه کنید
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-auto px-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="staff-name">نام و نام خانوادگی</FieldLabel>
              <Input
                id="staff-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: نرگس کاظمی"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="staff-email">ایمیل</FieldLabel>
              <Input
                id="staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="text-left"
                dir="ltr"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="staff-password">رمز عبور</FieldLabel>
              <Input
                id="staff-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز ورود به سیستم"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="staff-phone">تلفن (اختیاری)</FieldLabel>
              <Input
                id="staff-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="۰۹۱۲..."
              />
            </Field>

            <Field>
              <FieldLabel>نقش</FieldLabel>
              <Select value={role} onValueChange={(v) => setRole(v as 'staff' | 'manager')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">پرسنل</SelectItem>
                  <SelectItem value="manager">مدیر</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>
        </form>

        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={loading || !name || !email || !password}>
            {loading && <Spinner className="ml-2" />}
            {loading ? 'در حال افزودن...' : 'افزودن پرسنل'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">انصراف</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
