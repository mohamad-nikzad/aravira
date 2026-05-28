import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@repo/ui/field'
import { FormRootError } from '@repo/ui/form'
import { Spinner } from '@repo/ui/spinner'
import { ApiError } from '@repo/api-client'
import { clearOfflineDatabase } from '@repo/data-client'
import { displayPhone } from '@repo/salon-core/phone'
import { signupSchema } from '@repo/salon-core/forms/auth'
import type { SignupFormInput } from '@repo/salon-core/forms/auth'
import type { User } from '@repo/salon-core/types'

import { api } from '#/lib/api-client'
import { authQueryKey, useAuth } from '#/lib/auth'
import { homePathForRole } from '#/lib/navigation'

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

export const Route = createFileRoute('/signup')({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData<User | null>({
      queryKey: authQueryKey,
    })
    if (user) {
      throw redirect({ to: homePathForRole(user.role) })
    }
  },
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()

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

  const slug = watch('slug')
  const managerPhone = watch('managerPhone')
  const slugEdited = watch('slug') !== makeSlug(watch('salonName'))

  function handleSalonNameChange(value: string) {
    setValue('salonName', value, { shouldValidate: false })
    if (!slugEdited) {
      setValue('slug', makeSlug(value), { shouldValidate: false })
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const data = await api.auth.signup(values)
      await clearOfflineDatabase()
      setUser(data.user)
      await navigate({ to: homePathForRole(data.user.role) })
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message || 'ثبت‌نام انجام نشد. دوباره تلاش کنید.'
          : 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'
      setError('root', { message })
    }
  })

  const managerNameField = register('managerName')
  const passwordField = register('password')

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            ساخت سالن جدید
          </h1>
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
                  value={watch('salonName')}
                  onChange={(e) => handleSalonNameChange(e.target.value)}
                  placeholder="مثلاً سالن رز"
                  autoComplete="organization"
                  disabled={isSubmitting}
                  className="h-12 rounded-lg bg-muted/40"
                />
                {errors.salonName && (
                  <FieldError>{errors.salonName.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="slug">آدرس سالن</FieldLabel>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => {
                    setValue('slug', makeSlug(e.target.value), {
                      shouldValidate: false,
                    })
                  }}
                  placeholder="rose-salon"
                  autoComplete="off"
                  disabled={isSubmitting}
                  dir="ltr"
                  className="h-12 rounded-lg bg-muted/40 text-left"
                />
                <FieldDescription dir="ltr">
                  saloora.beauty/{slug || 'salon'}
                </FieldDescription>
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
                {errors.managerName && (
                  <FieldError>{errors.managerName.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="managerPhone">
                  شماره موبایل مدیر
                </FieldLabel>
                <Input
                  id="managerPhone"
                  type="tel"
                  value={displayPhone(managerPhone)}
                  onChange={(e) =>
                    setValue('managerPhone', e.target.value, {
                      shouldValidate: false,
                    })
                  }
                  placeholder="۰۹۱۲۰۰۰۰۰۰۰"
                  autoComplete="username"
                  inputMode="numeric"
                  disabled={isSubmitting}
                  dir="ltr"
                  className="h-12 rounded-lg bg-muted/40 text-left tabular-nums"
                />
                {errors.managerPhone && (
                  <FieldError>{errors.managerPhone.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="password">رمز عبور</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="حداقل ۶ کاراکتر"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className="h-12 rounded-lg bg-muted/40"
                  {...passwordField}
                />
                {errors.password && (
                  <FieldError>{errors.password.message}</FieldError>
                )}
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
          <Link
            to="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            ورود
          </Link>
        </p>
      </div>
    </main>
  )
}
