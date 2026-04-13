'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    const email = (form.get('email') as string).trim()
    const password = form.get('password') as string

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'ایمیل یا رمز عبور اشتباه است')
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
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary">
            <svg
              className="h-7 w-7 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">سالن زیبایی بلوم</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            سیستم مدیریت نوبت‌دهی
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>خوش آمدید</CardTitle>
            <CardDescription>
              برای مدیریت نوبت‌ها وارد شوید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">ایمیل</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="manager@salon.com"
                    autoComplete="email"
                    required
                    disabled={loading}
                    className="text-left"
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
                  />
                </Field>

                {error && <FieldError>{error}</FieldError>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Spinner className="ml-2" /> : null}
                  {loading ? 'در حال ورود...' : 'ورود'}
                </Button>
              </FieldGroup>
            </form>

            <div className="mt-6 rounded-lg bg-muted p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">اطلاعات ورود نمایشی:</p>
              <p className="text-xs text-muted-foreground">
                مدیر: manager@salon.com
              </p>
              <p className="text-xs text-muted-foreground">
                پرسنل: emma@salon.com، lisa@salon.com، nina@salon.com
              </p>
              <p className="text-xs text-muted-foreground">
                رمز عبور (همه): admin123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
