'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Field, FieldLabel, FieldError, FieldGroup } from '@repo/ui/field'
import { Spinner } from '@repo/ui/spinner'
import { homePathForRole } from '@/lib/navigation'
import type { User } from '@repo/salon-core/types'
import { displayPhone, normalizePhone } from '@repo/salon-core/phone'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const showDemoCredentials = process.env.NODE_ENV !== 'production'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const normalizedPhone = normalizePhone(phone)
    const password = form.get('password') as string

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: normalizedPhone, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'شماره موبایل یا رمز عبور اشتباه است')
        setLoading(false)
        return
      }

      const nextUser = data.user as User | undefined
      router.push(nextUser ? homePathForRole(nextUser.role) : '/calendar')
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
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#9B3636]">
            <svg viewBox="-250 -310 500 540" className="h-14 w-14" aria-label="آراویرا">
              <circle cx="-120" cy="120" r="75" fill="none" stroke="white" strokeWidth="40"/>
              <circle cx="120" cy="120" r="75" fill="none" stroke="white" strokeWidth="40"/>
              <path d="M-68,62 L-30,-10 L80,-260 C85,-272 75,-280 65,-275 L-18,2 Z" fill="white"/>
              <path d="M68,62 L30,-10 L-80,-260 C-85,-272 -75,-280 -65,-275 L18,2 Z" fill="white"/>
              <circle cx="0" cy="10" r="22" fill="#9B3636" stroke="white" strokeWidth="12"/>
            </svg>
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
                  value={displayPhone(phone)}
                  onChange={(event) => setPhone(normalizePhone(event.target.value))}
                  placeholder="مثلاً ۰۹۱۲۰۰۰۰۰۰۰"
                  autoComplete="username"
                  inputMode="numeric"
                  required
                  disabled={loading}
                  className="h-12 rounded-xl bg-muted/40 border-border/50 text-base text-left tabular-nums"
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
                {loading ? 'در حال ورود…' : 'ورود'}
              </Button>
            </FieldGroup>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          سالن جدید دارید؟{' '}
          <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
            ساخت حساب مدیر
          </Link>
        </p>

        {showDemoCredentials && (
          <div className="mt-5 rounded-xl bg-muted/40 p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">حساب‌های آزمایشی:</p>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground" dir="ltr">
                مدیر: {displayPhone('09120000000')}
              </p>
              <p className="text-xs text-muted-foreground" dir="ltr">
                پرسنل: {displayPhone('09120000001')}، {displayPhone('09120000002')}
              </p>
              <p className="text-xs text-muted-foreground">رمز (همه): admin123</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
