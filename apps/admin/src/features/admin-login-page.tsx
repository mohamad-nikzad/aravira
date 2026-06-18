import { ApiError } from '@repo/api-client/errors'
import { getApiV1AdminAuthMe } from '@repo/api-client/sdk'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { LogIn, ShieldAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { Input } from '#/components/ui/input'

async function signIn(input: { phoneNumber: string; password: string }) {
  const response = await fetch('/api/v1/auth/sign-in/phone-number', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    let message = 'شماره موبایل یا رمز عبور درست نیست.'
    try {
      const body = (await response.json()) as { error?: string; message?: string }
      message = body.error ?? body.message ?? message
    } catch {
      message = response.statusText || message
    }
    throw new Error(message)
  }
}

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const loginMutation = useMutation({
    mutationFn: async (input: { phoneNumber: string; password: string }) => {
      await signIn(input)
      await getApiV1AdminAuthMe({ throwOnError: true })
    },
    onSuccess: async () => {
      await navigate({ to: '/overview', replace: true })
    },
    onError: (caught) => {
      if (caught instanceof ApiError && caught.status === 403) {
        setError('این حساب وارد شده، اما ادمین فعال پلتفرم نیست.')
        return
      }
      setError(caught instanceof Error ? caught.message : 'ورود انجام نشد.')
    },
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    loginMutation.mutate({
      phoneNumber: String(form.get('phoneNumber') ?? ''),
      password: String(form.get('password') ?? ''),
    })
  }

  return (
    <main className="grid min-h-svh place-items-center bg-sidebar p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold">ادمین سالونا</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            برای ادامه با حساب ادمین پلتفرم وارد شوید.
          </p>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted-foreground">شماره موبایل</span>
              <Input name="phoneNumber" dir="ltr" inputMode="tel" autoComplete="username" required />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted-foreground">رمز عبور</span>
              <Input name="password" type="password" autoComplete="current-password" required />
            </label>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={loginMutation.isPending}>
              <LogIn className="h-4 w-4" />
              ورود
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
