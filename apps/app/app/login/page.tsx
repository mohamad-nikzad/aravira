'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Field, FieldLabel, FieldError, FieldGroup } from '@repo/ui/field'
import { FormRootError } from '@repo/ui/form'
import { Spinner } from '@repo/ui/spinner'
import { homePathForRole } from '@/lib/navigation'
import type { User } from '@repo/salon-core/types'
import { displayPhone } from '@repo/salon-core/phone'
import { loginSchema, type LoginFormInput } from '@repo/salon-core/forms/auth'
import { SalooraMark } from '@/components/brand/saloora-logo'

export default function LoginPage() {
  const router = useRouter()
  const showDemoCredentials = process.env.NODE_ENV !== 'production'

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  })

  const phoneValue = watch('phone') ?? ''

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      })

      const data = await res.json()

      if (!res.ok) {
        setError('root', {
          message: data.error || 'شماره موبایل یا رمز عبور اشتباه است',
        })
        return
      }

      const nextUser = data.user as User | undefined
      router.push(nextUser ? homePathForRole(nextUser.role) : '/calendar')
      router.refresh()
    } catch {
      setError('root', { message: 'خطایی رخ داد. لطفا دوباره تلاش کنید.' })
    }
  })

  const passwordField = register('password')

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background p-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 20%, var(--saloora-rose) 0%, transparent 50%), radial-gradient(circle at 70% 80%, var(--primary) 0%, transparent 50%)',
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-10 text-center">
          <SalooraMark className="mx-auto mb-5 size-20 rounded-[1.65rem]" priority />
          <h1 className="text-3xl font-black text-foreground tracking-tight">سالورا</h1>
          <p className="mt-2 text-sm text-muted-foreground">مدیریت هوشمند سالن زیبایی</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/95 p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h2 className="text-base font-semibold text-foreground">خوش آمدید</h2>
            <p className="mt-1 text-sm text-muted-foreground">برای ادامه وارد شوید</p>
          </div>

          <form onSubmit={onSubmit} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="phone">شماره موبایل</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  value={displayPhone(phoneValue)}
                  onChange={(event) => setValue('phone', event.target.value, { shouldValidate: false })}
                  placeholder="مثلاً ۰۹۱۲۰۰۰۰۰۰۰"
                  autoComplete="username"
                  inputMode="numeric"
                  disabled={isSubmitting}
                  className="h-12 rounded-xl bg-muted/40 border-border/50 text-base text-left tabular-nums"
                  dir="ltr"
                />
                {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="password">رمز عبور</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="رمز عبور را وارد کنید"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className="h-12 rounded-xl bg-muted/40 border-border/50"
                  {...passwordField}
                />
                {errors.password && <FieldError>{errors.password.message}</FieldError>}
              </Field>

              <FormRootError message={errors.root?.message} />

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold touch-manipulation shadow-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Spinner className="ml-2" /> : null}
                {isSubmitting ? 'در حال ورود…' : 'ورود'}
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
