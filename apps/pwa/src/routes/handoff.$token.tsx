import { useState, type FormEvent, type ReactNode } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, KeyRound, ShieldCheck } from 'lucide-react'

import { Button } from '@repo/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@repo/ui/field'
import { Input } from '@repo/ui/input'
import { Spinner } from '@repo/ui/spinner'
import { ApiError } from '@repo/api-client'
import { newPasswordSchema } from '@repo/salon-core/forms/auth'

import { OtpCodeInput } from '#/components/auth/otp-code-input'
import { PasswordInput } from '#/components/password-input'
import { SalunaMark } from '#/components/brand/saluna-mark'
import { api } from '#/lib/api-client'
import { authQueryKey } from '#/lib/auth'
import { getOtpErrorMessage, normalizeOtpCode } from '#/lib/auth-otp'

export const Route = createFileRoute('/handoff/$token')({
  component: SalonHandoffPage,
})

type Step = 'intro' | 'otp' | 'account' | 'done'

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  return 'مشکلی پیش آمد. دوباره تلاش کنید.'
}

function SalonHandoffPage() {
  const { token } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>('intro')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [accountError, setAccountError] = useState<string | null>(null)
  const handoffQuery = useQuery({
    queryKey: ['salon-handoff', token],
    queryFn: ({ signal }) => api.auth.getSalonHandoff(token, { signal }),
    retry: false,
  })
  const sendOtp = useMutation({
    mutationFn: () => api.auth.sendSalonHandoffOtp(token),
    onSuccess: () => setStep('otp'),
  })
  const verifyOtp = useMutation({
    mutationFn: (code: string) => api.auth.verifySalonHandoffOtp(token, code),
    onSuccess: () => {
      setOtpError(null)
      setStep('account')
    },
    onError: (error) => setOtpError(getOtpErrorMessage(error)),
  })
  const complete = useMutation({
    mutationFn: (input: { displayName: string; password?: string }) =>
      api.auth.completeSalonHandoff(token, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authQueryKey })
      setStep('done')
      await navigate({ to: '/dashboard', replace: true })
    },
  })

  function submitOtp(value?: string) {
    const code = normalizeOtpCode(value ?? otp)
    if (code.length !== 6) {
      setOtpError('کد ۶ رقمی را کامل وارد کنید')
      return
    }
    verifyOtp.mutate(code)
  }

  function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const requiresPassword = handoffQuery.data?.requiresPassword ?? true
    const form = new FormData(event.currentTarget)
    const displayName = String(form.get('displayName') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const confirmation = String(form.get('confirmation') ?? '')
    if (!displayName) {
      setAccountError('نام خودتان را وارد کنید')
      return
    }
    if (requiresPassword) {
      const passwordResult = newPasswordSchema.safeParse(password)
      if (!passwordResult.success) {
        setAccountError(
          passwordResult.error.issues[0]?.message ?? 'رمز عبور معتبر نیست',
        )
        return
      }
      if (password !== confirmation) {
        setAccountError('رمز عبور و تکرار آن یکسان نیستند')
        return
      }
    }
    setAccountError(null)
    complete.mutate({
      displayName,
      ...(requiresPassword ? { password } : {}),
    })
  }

  if (handoffQuery.isLoading) {
    return (
      <HandoffShell>
        <Spinner className="size-7" />
      </HandoffShell>
    )
  }
  if (handoffQuery.isError || !handoffQuery.data) {
    return (
      <HandoffShell>
        <div className="max-w-sm text-center">
          <KeyRound className="mx-auto mb-5 size-10 text-muted-foreground" />
          <h1 className="text-xl font-bold">این لینک دیگر معتبر نیست</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            از مدیر راه‌اندازی سالن بخواهید یک لینک تازه برایتان بسازد.
          </p>
        </div>
      </HandoffShell>
    )
  }

  return (
    <HandoffShell>
      <div className="w-full max-w-md">
        <div
          className="mb-8 flex items-center justify-center gap-2"
          aria-label="مراحل تحویل سالن"
        >
          {(['intro', 'otp', 'account'] as const).map((item, index) => {
            const active =
              ['intro', 'otp', 'account', 'done'].indexOf(step) >= index
            return (
              <span
                key={item}
                className={`h-1.5 rounded-full transition-all ${active ? 'w-12 bg-primary' : 'w-7 bg-border'}`}
              />
            )
          })}
        </div>

        {step === 'intro' ? (
          <section className="text-center">
            <div className="mx-auto mb-6 grid size-16 place-items-center rounded-3xl bg-primary/10 text-primary">
              <ShieldCheck className="size-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              سالن آماده تحویل به شماست
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
              برای حفظ امنیت، شماره ثبت‌شده{' '}
              <bdi dir="ltr" className="font-semibold text-foreground">
                {handoffQuery.data.phone}
              </bdi>{' '}
              را با کد پیامکی تایید کنید.
            </p>
            <Button
              className="mt-8 w-full"
              size="lg"
              onClick={() => sendOtp.mutate()}
              disabled={sendOtp.isPending}
            >
              {sendOtp.isPending ? (
                <Spinner />
              ) : (
                <ArrowLeft data-icon="inline-end" />
              )}
              دریافت کد تایید
            </Button>
            {sendOtp.isError ? (
              <p className="mt-3 text-sm text-destructive">
                {errorMessage(sendOtp.error)}
              </p>
            ) : null}
          </section>
        ) : null}

        {step === 'otp' ? (
          <section>
            <h1 className="text-center text-2xl font-black">
              کد تایید را وارد کنید
            </h1>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              کد فقط برای همان شماره ثبت‌شده ارسال شده است.
            </p>
            <Field className="mt-8" data-invalid={Boolean(otpError)}>
              <FieldLabel htmlFor="otp" className="sr-only">
                کد تایید
              </FieldLabel>
              <OtpCodeInput
                id="otp"
                value={otp}
                onValueChange={(value) => {
                  setOtp(value)
                  setOtpError(null)
                }}
                onComplete={submitOtp}
                disabled={verifyOtp.isPending}
                invalid={Boolean(otpError)}
              />
              {otpError ? <FieldError>{otpError}</FieldError> : null}
            </Field>
            <Button
              className="mt-6 w-full"
              size="lg"
              disabled={verifyOtp.isPending}
              onClick={() => submitOtp()}
            >
              {verifyOtp.isPending ? <Spinner /> : null}تایید شماره
            </Button>
          </section>
        ) : null}

        {step === 'account' ? (
          <form onSubmit={submitAccount}>
            <h1 className="text-center text-2xl font-black">
              ورود امن خودتان را بسازید
            </h1>
            <p className="mt-3 text-center text-sm leading-7 text-muted-foreground">
              {handoffQuery.data.requiresPassword
                ? 'این رمز فقط نزد شما می‌ماند؛ تیم راه‌اندازی آن را نمی‌بیند.'
                : 'حساب قبلی شما استفاده می‌شود و رمز عبورتان بدون تغییر می‌ماند.'}
            </p>
            <FieldGroup className="mt-7 gap-5">
              <Field>
                <FieldLabel htmlFor="displayName">نام شما</FieldLabel>
                <Input
                  id="displayName"
                  name="displayName"
                  autoComplete="name"
                  required
                />
              </Field>
              {handoffQuery.data.requiresPassword ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="password">رمز عبور</FieldLabel>
                    <PasswordInput
                      id="password"
                      name="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirmation">
                      تکرار رمز عبور
                    </FieldLabel>
                    <PasswordInput
                      id="confirmation"
                      name="confirmation"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </Field>
                </>
              ) : null}
            </FieldGroup>
            {complete.isError ? (
              <p className="mt-4 text-sm text-destructive">
                {errorMessage(complete.error)}
              </p>
            ) : null}
            {accountError ? (
              <p className="mt-4 text-sm text-destructive">{accountError}</p>
            ) : null}
            <Button
              className="mt-7 w-full"
              size="lg"
              disabled={complete.isPending}
              type="submit"
            >
              {complete.isPending ? (
                <Spinner />
              ) : (
                <Check data-icon="inline-start" />
              )}
              تحویل سالن و ورود
            </Button>
          </form>
        ) : null}
      </div>
    </HandoffShell>
  )
}

function HandoffShell({ children }: { children: ReactNode }) {
  return (
    <main
      dir="rtl"
      className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-5 py-12"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_70%)]" />
      <div className="relative w-full max-w-lg rounded-[2rem] border bg-card/95 px-6 py-10 shadow-[0_28px_90px_-45px_color-mix(in_oklab,var(--primary)_48%,transparent)] sm:px-10">
        <SalunaMark className="mx-auto mb-9 h-9 w-auto" />
        <div className="flex min-h-64 items-center justify-center">
          {children}
        </div>
      </div>
    </main>
  )
}
