'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { cancelAppointmentRequest } from '../../../_lib/public-api'

type Props = { slug: string; token: string; accent: string }

export function CancelRequestButton({ slug, token, accent }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('آیا از لغو درخواست خود مطمئن هستید؟')
    ) {
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await cancelAppointmentRequest(slug, token)
        router.refresh()
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'لغو درخواست ممکن نشد. لطفاً دوباره تلاش کنید.',
        )
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-xl border-2 px-6 py-2.5 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50"
        style={{ borderColor: accent, color: accent }}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : null}
        لغو درخواست
      </button>
      {error ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}
