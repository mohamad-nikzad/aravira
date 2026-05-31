import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, Unlink } from 'lucide-react'

import { useAuth } from '#/lib/auth'
import { api } from '#/lib/api-client'
import { messagingAccountsQueryKey } from '#/lib/query-keys'

import { SettingsRow, ToggleRow } from '#/components/settings/settings-rows'

export function MessagingAccountsSection() {
  const { user } = useAuth()
  const isManager = user?.role === 'manager'
  const queryClient = useQueryClient()

  const messagingAccountsQuery = useQuery({
    queryKey: messagingAccountsQueryKey,
    queryFn: ({ signal }) => api.messaging.listAccounts({ signal }),
    enabled: isManager,
  })
  const telegramAccount =
    messagingAccountsQuery.data?.accounts.find((a) => a.provider === 'telegram') ??
    null

  const connectTelegram = useMutation({
    mutationFn: () => api.messaging.createLink({ provider: 'telegram' }),
    meta: {
      skipSuccessToast: true,
      errorMessage: 'اتصال تلگرام انجام نشد',
    },
    onSuccess: (data) => {
      window.open(data.deepLink, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: messagingAccountsQueryKey })
      }, 4000)
    },
  })

  const toggleTelegram = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.messaging.setEnabled(id, enabled),
    meta: {
      skipSuccessToast: true,
      errorMessage: 'تغییر وضعیت تلگرام انجام نشد',
      invalidatesQuery: messagingAccountsQueryKey,
    },
  })

  const unlinkTelegram = useMutation({
    mutationFn: (id: string) => api.messaging.unlink(id),
    meta: {
      successMessage: 'اتصال تلگرام قطع شد',
      errorMessage: 'قطع اتصال تلگرام انجام نشد',
      invalidatesQuery: messagingAccountsQueryKey,
    },
  })

  if (!isManager) return null

  if (telegramAccount) {
    return (
      <>
        <ToggleRow
          icon={Send}
          label="اعلان تلگرام"
          hint={
            telegramAccount.displayName
              ? `متصل به ${telegramAccount.displayName}`
              : 'متصل'
          }
          checked={telegramAccount.enabled}
          disabled={toggleTelegram.isPending}
          onChange={(next) =>
            toggleTelegram.mutate({ id: telegramAccount.id, enabled: next })
          }
        />
        <SettingsRow
          icon={Unlink}
          label="قطع اتصال تلگرام"
          onClick={() => {
            if (window.confirm('اتصال تلگرام قطع شود؟')) {
              unlinkTelegram.mutate(telegramAccount.id)
            }
          }}
          danger
          loading={unlinkTelegram.isPending}
          disabled={unlinkTelegram.isPending}
        />
      </>
    )
  }

  return (
    <SettingsRow
      icon={Send}
      label="اتصال تلگرام"
      hint="دریافت اعلان درخواست نوبت در تلگرام"
      onClick={() => connectTelegram.mutate()}
      loading={connectTelegram.isPending}
      disabled={connectTelegram.isPending || messagingAccountsQuery.isPending}
    />
  )
}
