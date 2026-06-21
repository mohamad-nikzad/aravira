import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  createManagerSupportMessageMutation,
  createManagerSupportTicketMutation,
  getManagerSupportTicketOptions,
  getManagerSupportTicketQueryKey,
  getManagerSupportTicketSummaryOptions,
  getManagerSupportTicketSummaryQueryKey,
  listManagerSupportTicketsOptions,
  listManagerSupportTicketsQueryKey,
  markManagerSupportTicketReadMutation,
} from '@repo/api-client/query'
import type {
  CreateManagerSupportTicketRequest,
  ListManagerSupportTicketsData,
  ManagerSupportTicketDetailResponse,
  ManagerSupportTicketMutationResponse,
} from '@repo/api-client/types'

const SUPPORT_TICKET_POLL_INTERVAL_MS = 60_000

export {
  getManagerSupportTicketQueryKey,
  getManagerSupportTicketSummaryQueryKey,
  listManagerSupportTicketsQueryKey,
}
export type {
  CreateManagerSupportTicketRequest,
  ManagerSupportTicketDetailResponse,
} from '@repo/api-client/types'

export function supportTicketListQueryOptions(
  query?: ListManagerSupportTicketsData['query'],
) {
  return {
    ...listManagerSupportTicketsOptions(query ? { query } : undefined),
    refetchInterval: SUPPORT_TICKET_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  }
}

export function supportTicketSummaryQueryOptions() {
  return {
    ...getManagerSupportTicketSummaryOptions(),
    refetchInterval: SUPPORT_TICKET_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  }
}

export function supportTicketDetailQueryOptions(ticketId: string) {
  return getManagerSupportTicketOptions({ path: { ticketId } })
}

function createDetailSeed(
  data: ManagerSupportTicketMutationResponse,
): ManagerSupportTicketDetailResponse {
  return {
    ticket: data.ticket,
    managerHasUnread: false,
    messages: [
      {
        id: data.message.id,
        authorKind: 'manager',
        authorUserId: data.message.authorUserId,
        authorDisplayName: data.message.authorDisplayNameSnapshot,
        body: data.message.body,
        createdAt: data.message.createdAt,
      },
    ],
    truncated: false,
  }
}

export function useCreateSupportTicketMutation() {
  const generated = createManagerSupportTicketMutation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (
      body: CreateManagerSupportTicketRequest,
      mutationContext,
    ) => generated.mutationFn!({ body }, mutationContext),
    onSuccess: async (data) => {
      const ticketId = data.ticket.id

      queryClient.setQueryData(
        supportTicketDetailQueryOptions(ticketId).queryKey,
        createDetailSeed(data),
      )

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: listManagerSupportTicketsQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: getManagerSupportTicketSummaryQueryKey(),
        }),
        navigate({
          to: '/support/$ticketId',
          params: { ticketId },
        }),
      ])
    },
    meta: {
      successMessage: 'درخواست پشتیبانی ایجاد شد',
      errorMessage: 'ایجاد درخواست پشتیبانی انجام نشد',
    },
  })
}

export function useAddManagerSupportMessageMutation(ticketId: string) {
  const generated = createManagerSupportMessageMutation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: string, mutationContext) =>
      generated.mutationFn!(
        { path: { ticketId }, body: { body } },
        mutationContext,
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getManagerSupportTicketQueryKey({ path: { ticketId } }),
        }),
        queryClient.invalidateQueries({
          queryKey: listManagerSupportTicketsQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: getManagerSupportTicketSummaryQueryKey(),
        }),
      ])
    },
    meta: {
      successMessage: 'پیام ارسال شد',
      errorMessage: 'ارسال پیام انجام نشد',
    },
  })
}

export function useMarkSupportTicketReadMutation(ticketId: string) {
  const generated = markManagerSupportTicketReadMutation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (_variables: void, mutationContext) =>
      generated.mutationFn!({ path: { ticketId } }, mutationContext),
    onSuccess: async () => {
      queryClient.setQueryData<ManagerSupportTicketDetailResponse>(
        getManagerSupportTicketQueryKey({ path: { ticketId } }),
        (current) =>
          current ? { ...current, managerHasUnread: false } : current,
      )

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getManagerSupportTicketQueryKey({ path: { ticketId } }),
        }),
        queryClient.invalidateQueries({
          queryKey: listManagerSupportTicketsQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: getManagerSupportTicketSummaryQueryKey(),
        }),
      ])
    },
    meta: { skipToast: true },
  })
}
