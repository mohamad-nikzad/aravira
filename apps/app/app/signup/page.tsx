'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@repo/ui/field'
import { Spinner } from '@repo/ui/spinner'

function makeSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return slug || 'salon'
}

export default function SignupPage() {
  const router = useRouter()
  const [salonName, setSalonName] = useState('')
  const [slug, setSlug] = useState('salon')
  const [slugEdited, setSlugEdited] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSalonNameChange(value: string) {
    setSalonName(value)
    if (!slugEdited) {
      setSlug(makeSlug(value))
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          salonName,
          slug,
          managerName: String(form.get('managerName') ?? '').trim(),
          managerPhone: String(form.get('managerPhone') ?? '').trim(),
          password: String(form.get('password') ?? ''),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'ثبت‌نام انجام نشد. دوباره تلاش کنید.')
        setLoading(false)
        return
      }

      router.push(data.redirectTo || '/onboarding')
      router.refresh()
    } catch {
      setError('خطایی رخ داد. لطفاً دوباره تلاش کنید.')
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-[#9B3636]">
            <svg viewBox="-250 -310 500 540" className="h-11 w-11" aria-label="آراویرا">
              <circle cx="-120" cy="120" r="75" fill="none" stroke="white" strokeWidth="40" />
              <circle cx="120" cy="120" r="75" fill="none" stroke="white" strokeWidth="40" />
              <path d="M-68,62 L-30,-10 L80,-260 C85,-272 75,-280 65,-275 L-18,2 Z" fill="white" />
              <path d="M68,62 L30,-10 L-80,-260 C-85,-272 -75,-280 -65,-275 L18,2 Z" fill="white" />
              <circle cx="0" cy="10" r="22" fill="#9B3636" stroke="white" strokeWidth="12" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">ساخت سالن جدید</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            سالن خود را بسازید و نوبت‌ها را مدیریت کنید
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-card p-5 shadow-sm">
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="salonName">نام سالن</FieldLabel>
                <Input
                  id="salonName"
                  name="salonName"
                  value={salonName}
                  onChange={(e) => handleSalonNameChange(e.target.value)}
                  placeholder="مثلاً سالن رز"
                  autoComplete="organization"
                  required
                  disabled={loading}
                  className="h-12 rounded-lg bg-muted/40"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="slug">آدرس سالن</FieldLabel>
                <Input
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugEdited(true)
                    setSlug(makeSlug(e.target.value))
                  }}
                  placeholder="rose-salon"
                  autoComplete="off"
                  required
                  disabled={loading}
                  dir="ltr"
                  className="h-12 rounded-lg bg-muted/40 text-left"
                />
                <FieldDescription dir="ltr">aravira.app/{slug || 'salon'}</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="managerName">نام مدیر</FieldLabel>
                <Input
                  id="managerName"
                  name="managerName"
                  placeholder="نام و نام خانوادگی"
                  autoComplete="name"
                  required
                  disabled={loading}
                  className="h-12 rounded-lg bg-muted/40"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="managerPhone">شماره موبایل مدیر</FieldLabel>
                <Input
                  id="managerPhone"
                  name="managerPhone"
                  type="tel"
                  placeholder="09120000000"
                  autoComplete="username"
                  inputMode="numeric"
                  required
                  disabled={loading}
                  dir="ltr"
                  className="h-12 rounded-lg bg-muted/40 text-left"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">رمز عبور</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="حداقل ۸ کاراکتر، شامل حرف و عدد"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  className="h-12 rounded-lg bg-muted/40"
                />
              </Field>

              {error && <FieldError>{error}</FieldError>}

              <Button
                type="submit"
                className="h-12 w-full rounded-lg text-base font-semibold touch-manipulation"
                disabled={loading}
              >
                {loading ? <Spinner className="ml-2" /> : null}
                {loading ? 'در حال ساخت...' : 'ساخت سالن'}
              </Button>
            </FieldGroup>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          حساب دارید؟{' '}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            ورود
          </Link>
        </p>
      </div>
    </main>
  )
}
