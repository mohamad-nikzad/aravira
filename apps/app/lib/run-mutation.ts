import { toast } from '@repo/ui/use-toast'
import { DataClientHttpError } from '@repo/data-client'

const DEFAULT_SUCCESS = 'عملیات با موفقیت انجام شد'
const DEFAULT_ERROR = 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'

type RunMutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: unknown }

type RunMutationOptions = {
  /** Success toast text. Pass `null` to suppress the success toast. */
  success?: string | null
  /** Fallback error toast text for non-HTTP errors (network, unexpected). */
  error?: string
}

/**
 * Runs a mutation and shows a success/failure toast. On failure it surfaces the
 * API's Persian message when the rejection is a DataClientHttpError; raw fetch
 * paths should `throw new DataClientHttpError(body.error, status, body)` so their
 * server message flows through here too.
 */
export async function runMutation<T>(
  fn: () => Promise<T>,
  opts?: RunMutationOptions
): Promise<RunMutationResult<T>> {
  try {
    const data = await fn()
    if (opts?.success !== null) {
      toast({ variant: 'success', title: opts?.success ?? DEFAULT_SUCCESS })
    }
    return { ok: true, data }
  } catch (error) {
    const message =
      error instanceof DataClientHttpError
        ? error.message
        : (opts?.error ?? DEFAULT_ERROR)
    toast({ variant: 'destructive', title: message })
    return { ok: false, error }
  }
}
