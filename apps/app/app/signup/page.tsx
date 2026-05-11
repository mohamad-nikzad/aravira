'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@repo/ui/field'
import { FormRootError } from '@repo/ui/form'
import { Spinner } from '@repo/ui/spinner'
import { displayPhone } from '@repo/salon-core/phone'
import { signupSchema, type SignupFormInput } from '@repo/salon-core/forms/auth'
import { SalooraMark } from '@/components/brand/saloora-logo'

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
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      salonName: '',
      slug: 'salon',
      managerName: '',
      managerPhone: '',
      password: '',
    },
  })

  const slug = watch('slug') ?? 'salon'
  const managerPhone = watch('managerPhone') ?? ''
  const slugEdited = watch('slug') !== makeSlug(watch('salonName') ?? '')

  function handleSalonNameChange(value: string) {
    setValue('salonName', value, { shouldValidate: false })
    if (!slugEdited) {
      setValue('slug', makeSlug(value), { shouldValidate: false })
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      })

      const data = await res.json()
      if (!res.ok) {
        setError('root', { message: data.error || 'ثبت‌نام انجام نشد. دوباره تلاش کنید.' })
        return
      }

      router.push(data.redirectTo || '/onboarding')
      router.refresh()
    } catch {
      setError('root', { message: 'خطایی رخ داد. لطفاً دوباره تلاش کنید.' })
    }
  })

  const managerNameField = register('managerName')
  const passwordField = register('password')

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <SalooraMark className="mx-auto mb-4 size-16 rounded-2xl" priority />
          <h1 className="text-2xl font-black tracking-tight text-foreground">ساخت سالن جدید</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            سالن خود را در سالورا بسازید و نوبت‌ها را مدیریت کنید
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-card/95 p-5 shadow-sm">
          <form onSubmit={onSubmit} noValidate>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="salonName">نام سالن</FieldLabel>
                <Input
                  id="salonName"
                  value={watch('salonName') ?? ''}
                  onChange={(e) => handleSalonNameChange(e.target.value)}
                  placeholder="مثلاً سالن رز"
                  autoComplete="organization"
                  disabled={isSubmitting}
                  className="h-12 rounded-lg bg-muted/40"
                />
                {errors.salonName && <FieldError>{errors.salonName.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="slug">آدرس سالن</FieldLabel>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => {
                    setValue('slug', makeSlug(e.target.value), { shouldValidate: false })
                  }}
                  placeholder="rose-salon"
                  autoComplete="off"
                  disabled={isSubmitting}
                  dir="ltr"
                  className="h-12 rounded-lg bg-muted/40 text-left"
                />
                <FieldDescription dir="ltr">aravira.app/{slug || 'salon'}</FieldDescription>
                {errors.slug && <FieldError>{errors.slug.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="managerName">نام مدیر</FieldLabel>
                <Input
                  id="managerName"
                  placeholder="نام و نام خانوادگی"
                  autoComplete="name"
                  disabled={isSubmitting}
                  className="h-12 rounded-lg bg-muted/40"
                  {...managerNameField}
                />
                {errors.managerName && <FieldError>{errors.managerName.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="managerPhone">شماره موبایل مدیر</FieldLabel>
                <Input
                  id="managerPhone"
                  type="tel"
                  value={displayPhone(managerPhone)}
                  onChange={(e) => setValue('managerPhone', e.target.value, { shouldValidate: false })}
                  placeholder="۰۹۱۲۰۰۰۰۰۰۰"
                  autoComplete="username"
                  inputMode="numeric"
                  disabled={isSubmitting}
                  dir="ltr"
                  className="h-12 rounded-lg bg-muted/40 text-left tabular-nums"
                />
                {errors.managerPhone && <FieldError>{errors.managerPhone.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="password">رمز عبور</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="حداقل ۸ کاراکتر، شامل حرف و عدد"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className="h-12 rounded-lg bg-muted/40"
                  {...passwordField}
                />
                {errors.password && <FieldError>{errors.password.message}</FieldError>}
              </Field>

              <FormRootError message={errors.root?.message} />

              <Button
                type="submit"
                className="h-12 w-full rounded-lg text-base font-semibold touch-manipulation"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Spinner className="ml-2" /> : null}
                {isSubmitting ? 'در حال ساخت…' : 'ساخت سالن'}
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
