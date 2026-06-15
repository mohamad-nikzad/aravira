import { useState } from 'react'
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Field, FieldError, FieldGroup, FieldLabel } from '@repo/ui/field'
import { FormRootError } from '@repo/ui/form'
import { Spinner } from '@repo/ui/spinner'
import { ApiError } from '@repo/api-client'
import { displayPhone } from '@repo/salon-core/phone'
import { loginSchema } from '@repo/salon-core/forms/auth'
import type { LoginFormInput } from '@repo/salon-core/forms/auth'
import { phoneSchema } from '@repo/salon-core/forms/primitives'

import { brand } from '@repo/brand'
import { OtpCodeInput } from '#/components/auth/otp-code-input'
import { PasswordInput } from '#/components/password-input'
import { api } from '#/lib/api-client'
import {
  AUTH_OTP_CODE_LENGTH,
  AUTH_OTP_RESEND_SECONDS,
  getOtpErrorMessage,
  normalizeOtpCode,
  useResendCountdown,
} from '#/lib/auth-otp'
import { getMutationErrorMessage } from '#/lib/query-client'
import { authQueryKey, useAuth } from '#/lib/auth'
import type { AuthSession } from '#/lib/auth'
import { homePathForRole } from '#/lib/navigation'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

type LoginMode = 'password' | 'otp'

/** Only honor internal relative paths to avoid open-redirect. */
function safeInternalRedirect(value: string | undefined): string | null {
  return value && value.startsWith('/') ? value : null
}

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData<AuthSession>({
      queryKey: authQueryKey,
    })
    if (session?.status === 'needs_workspace') {
      throw redirect({ to: '/signup' })
    }
    if (session) {
      const { user } = session
      const safe = safeInternalRedirect(search.redirect)
      if (safe) throw redirect({ href: safe })
      throw redirect({ to: homePathForRole(user.role) })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { redirect: redirectTo } = Route.useSearch()
  const { refresh, setUser } = useAuth()
  const showDemoCredentials = import.meta.env.DEV
  const [mode, setMode] = useState<LoginMode>('password')
  const [otpPhone, setOtpPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(
    null,
  )
  const resendRemaining = useResendCountdown(resendAvailableAt)

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  })

  const phoneValue = watch('phone')
  const isPasswordMode = mode === 'password'

  const login = useMutation({
    mutationFn: (values: LoginFormInput) => api.auth.login(values),
    meta: { skipToast: true },
    onSuccess: async (data) => {
      setUser(data.user)
      const safe = safeInternalRedirect(redirectTo)
      if (safe) await navigate({ href: safe })
      else await navigate({ to: homePathForRole(data.user.role) })
    },
  })

  const sendOtp = useMutation({
    mutationFn: ({ phone }: { phone: string }) =>
      api.auth.sendPhoneOtp({ phone }),
    meta: { skipToast: true },
    onSuccess: (_, values) => {
      setOtpPhone(values.phone)
      setOtp('')
      setOtpError(null)
      setResendAvailableAt(Date.now() + AUTH_OTP_RESEND_SECONDS * 1000)
      setMode('otp')
    },
  })

  const verifyOtp = useMutation({
    mutationFn: (code: string) =>
      api.auth.verifyPhoneOtp({ phone: otpPhone, code }),
    meta: { skipToast: true },
    onSuccess: async () => {
      setOtpError(null)
      const session = await refresh()
      const safe = safeInternalRedirect(redirectTo)
      if (session?.status === 'needs_workspace') {
        await navigate({ to: '/signup' })
        return
      }
      if (session?.user) {
        setUser(session.user)
        if (safe) await navigate({ href: safe })
        else await navigate({ to: homePathForRole(session.user.role) })
        return
      }
      setOtpError('ورود انجام نشد. دوباره تلاش کنید.')
    },
  })

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onError: async (err) => {
        if (
          err instanceof Error &&
          err.message === 'authenticated user has no workspace'
        ) {
          await refresh()
          await navigate({ to: '/signup' })
          return
        }
        const message =
          err instanceof ApiError
            ? err.status === 401
              ? 'شماره موبایل یا رمز عبور اشتباه است'
              : err.message || 'شماره موبایل یا رمز عبور اشتباه است'
            : getMutationErrorMessage(
                err,
                'خطایی رخ داد. لطفا دوباره تلاش کنید.',
              )
        setError('root', { message })
      },
    })
  })

  const startOtpLogin = () => {
    const parsedPhone = phoneSchema.safeParse(phoneValue)
    if (!parsedPhone.success) {
      setError('phone', { message: parsedPhone.error.issues[0]?.message })
      return
    }
    clearErrors()
    sendOtp.mutate(
      { phone: parsedPhone.data },
      {
        onError: (err) => {
          const message =
            err instanceof ApiError
              ? err.status === 429
                ? 'برای دریافت کد جدید کمی صبر کنید.'
                : err.message || 'ارسال کد ورود انجام نشد.'
              : getMutationErrorMessage(err, 'ارسال کد ورود انجام نشد.')
          setError('root', { message })
        },
      },
    )
  }

  const submitOtp = () => {
    const code = normalizeOtpCode(otp)
    if (code.length !== AUTH_OTP_CODE_LENGTH) {
      setOtpError(`کد ${AUTH_OTP_CODE_LENGTH} رقمی را کامل وارد کنید`)
      return
    }
    verifyOtp.mutate(code, {
      onError: (err) => setOtpError(getOtpErrorMessage(err)),
    })
  }

  const resendOtp = () => {
    if (!otpPhone || resendRemaining > 0) return
    sendOtp.mutate(
      { phone: otpPhone },
      { onError: (err) => setOtpError(getOtpErrorMessage(err)) },
    )
  }

  const passwordField = register('password')
  const isBusy = login.isPending || sendOtp.isPending || verifyOtp.isPending

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background p-4">
      <div className="relative w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            {brand.name.fa}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            مدیریت هوشمند سالن زیبایی
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/95 p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h2 className="text-base font-semibold text-foreground">
              خوش آمدید
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              برای ادامه وارد شوید
            </p>
          </div>

          <form onSubmit={onSubmit} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="phone">شماره موبایل</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  value={displayPhone(phoneValue)}
                  onChange={(event) =>
                    setValue('phone', event.target.value, {
                      shouldValidate: false,
                    })
                  }
                  placeholder="مثلاً ۰۹۱۲۰۰۰۰۰۰۰"
                  autoComplete="username"
                  inputMode="numeric"
                  disabled={isBusy || !isPasswordMode}
                  className="h-12 rounded-xl bg-muted/40 border-border/50 text-base text-left tabular-nums"
                  dir="ltr"
                />
                {errors.phone && (
                  <FieldError>{errors.phone.message}</FieldError>
                )}
              </Field>

              {isPasswordMode ? (
                <Field>
                  <FieldLabel htmlFor="password">رمز عبور</FieldLabel>
                  <PasswordInput
                    id="password"
                    placeholder="رمز عبور را وارد کنید"
                    autoComplete="current-password"
                    disabled={isBusy}
                    className="h-12 rounded-xl bg-muted/40 border-border/50"
                    {...passwordField}
                  />
                  {errors.password && (
                    <FieldError>{errors.password.message}</FieldError>
                  )}
                </Field>
              ) : (
                <Field>
                  <FieldLabel htmlFor="otp">کد پیامکی</FieldLabel>
                  <OtpCodeInput
                    value={otp}
                    onValueChange={(value) => {
                      setOtp(value)
                      setOtpError(null)
                    }}
                    disabled={verifyOtp.isPending}
                    invalid={Boolean(otpError)}
                    slotClassName="h-11 w-10 bg-muted/40"
                  />
                  {otpError ? <FieldError>{otpError}</FieldError> : null}
                </Field>
              )}

              <FormRootError message={errors.root?.message} />

              {isPasswordMode ? (
                <>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-base font-semibold touch-manipulation shadow-sm"
                    disabled={isBusy}
                  >
                    {login.isPending ? <Spinner className="ml-2" /> : null}
                    {login.isPending ? 'در حال ورود…' : 'ورود'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-xl text-base font-semibold touch-manipulation"
                    disabled={isBusy}
                    onClick={startOtpLogin}
                  >
                    {sendOtp.isPending ? <Spinner className="ml-2" /> : null}
                    ورود با کد پیامکی
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    className="w-full h-12 rounded-xl text-base font-semibold touch-manipulation shadow-sm"
                    disabled={verifyOtp.isPending}
                    onClick={submitOtp}
                  >
                    {verifyOtp.isPending ? <Spinner className="ml-2" /> : null}
                    تایید و ورود
                  </Button>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <button
                      type="button"
                      className="font-semibold text-primary disabled:text-muted-foreground"
                      disabled={sendOtp.isPending || resendRemaining > 0}
                      onClick={resendOtp}
                    >
                      ارسال دوباره کد
                    </button>
                    <span>
                      {resendRemaining > 0 ? `${resendRemaining} ثانیه` : null}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="text-sm font-semibold text-muted-foreground"
                    onClick={() => {
                      setMode('password')
                      setOtp('')
                      setOtpError(null)
                    }}
                  >
                    ورود با رمز عبور یا تغییر شماره
                  </button>
                </>
              )}
            </FieldGroup>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          سالن جدید دارید؟{' '}
          <Link
            to="/signup"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            ساخت حساب مدیر
          </Link>
        </p>

        {showDemoCredentials && (
          <div className="mt-5 rounded-xl bg-muted/40 p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              حساب‌های آزمایشی:
            </p>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground" dir="ltr">
                مدیر: {displayPhone('09120000000')}
              </p>
              <p className="text-xs text-muted-foreground" dir="ltr">
                پرسنل: {displayPhone('09120000001')}،{' '}
                {displayPhone('09120000002')}
              </p>
              <p className="text-xs text-muted-foreground">
                رمز (همه): admin123
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
