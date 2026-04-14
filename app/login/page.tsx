'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const phone = (form.get('phone') as string).trim()
    const password = form.get('password') as string

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'شماره موبایل یا رمز عبور اشتباه است')
        setLoading(false)
        return
      }

      router.push('/calendar')
      router.refresh()
    } catch {
      setError('خطایی رخ داد. لطفا دوباره تلاش کنید.')
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background p-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 30% 20%, var(--primary) 0%, transparent 50%), radial-gradient(circle at 70% 80%, var(--primary) 0%, transparent 50%)',
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm">
            <span className="text-3xl font-black text-primary">آ</span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">آراویرا</h1>
          <p className="mt-2 text-sm text-muted-foreground">سامانه مدیریت نوبت‌دهی</p>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h2 className="text-base font-semibold text-foreground">خوش آمدید</h2>
            <p className="mt-1 text-sm text-muted-foreground">برای ادامه وارد شوید</p>
          </div>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="phone">شماره موبایل</FieldLabel>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="09120000000"
                  autoComplete="username"
                  inputMode="numeric"
                  required
                  disabled={loading}
                  className="text-left h-12 rounded-xl bg-muted/40 border-border/50 text-base"
                  dir="ltr"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">رمز عبور</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="رمز عبور را وارد کنید"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="h-12 rounded-xl bg-muted/40 border-border/50"
                />
              </Field>

              {error && <FieldError>{error}</FieldError>}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold touch-manipulation shadow-sm"
                disabled={loading}
              >
                {loading ? <Spinner className="ml-2" /> : null}
                {loading ? 'در حال ورود...' : 'ورود'}
              </Button>
            </FieldGroup>
          </form>
        </div>

        <div className="mt-5 rounded-xl bg-muted/40 p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">حساب‌های آزمایشی:</p>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground" dir="ltr">
              مدیر: 09120000000
            </p>
            <p className="text-xs text-muted-foreground" dir="ltr">
              پرسنل: 09120000001، 09120000002
            </p>
            <p className="text-xs text-muted-foreground">رمز (همه): admin123</p>
          </div>
        </div>
      </div>
    </main>
  )
}
