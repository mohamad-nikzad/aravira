import {
  approveAppointmentRequest,
  getAppointmentRequestForCallback,
  rejectAppointmentRequest,
} from '@repo/database/appointment-requests'
import { findAccountByExternalId, type MessagingProviderId } from '@repo/database/messaging'
import { getMemberForUser } from '@repo/database/members'
import { findSoleCapableStaffUserId } from '@repo/database/staff'
import { salonCurrentHm } from '@repo/salon-core/salon-local-time'
import { escapeHtml } from '../providers/telegram'
import type { MessagingButton } from '../providers/types'

export type CallbackInput = {
  provider: MessagingProviderId
  externalId: string
  requestId: string
  /** Used to render an "Open in app" fallback button when auto-assign can't proceed. */
  publicAppBaseUrl?: string | null
}

export type CallbackOutcome = {
  /** HTML-safe body the route should write back via editMessageText. */
  messageHtml: string
  /** Replacement keyboard, or null to drop all buttons. */
  replacementKeyboard: MessagingButton[][] | null
  /** Short text shown as a popup toast over the tapped button (<=200 chars). */
  toast: string
}

const MANAGER_ROLES = new Set(['owner', 'admin'])

type ResolvedCaller = {
  userId: string
  displayName: string
}

type ResolveOk = { ok: true; caller: ResolvedCaller; salonId: string; serviceId: string }
type ResolveErr = { ok: false; outcome: CallbackOutcome }

async function resolveCaller(input: CallbackInput): Promise<ResolveOk | ResolveErr> {
  const account = await findAccountByExternalId(input.provider, input.externalId)
  if (!account || !account.enabled) {
    return {
      ok: false,
      outcome: {
        messageHtml: '⚠️ این حساب پیام‌رسان به آراویرا متصل نیست.',
        replacementKeyboard: null,
        toast: 'حساب متصل نیست',
      },
    }
  }

  const request = await getAppointmentRequestForCallback(input.requestId)
  if (!request) {
    return {
      ok: false,
      outcome: {
        messageHtml: '⚠️ این درخواست یافت نشد.',
        replacementKeyboard: null,
        toast: 'درخواست یافت نشد',
      },
    }
  }

  const member = await getMemberForUser(account.userId)
  if (!member || member.organizationId !== request.salonId || !MANAGER_ROLES.has(member.role)) {
    return {
      ok: false,
      outcome: {
        messageHtml: '⚠️ شما دیگر مدیر این سالن نیستید.',
        replacementKeyboard: null,
        toast: 'دسترسی ندارید',
      },
    }
  }

  if (request.status !== 'pending') {
    return {
      ok: false,
      outcome: {
        messageHtml: '⚠️ این درخواست قبلاً رسیدگی شده است.',
        replacementKeyboard: null,
        toast: 'قبلاً رسیدگی شده',
      },
    }
  }

  return {
    ok: true,
    caller: { userId: account.userId, displayName: member.name },
    salonId: request.salonId,
    serviceId: request.serviceId,
  }
}

function openInAppKeyboard(
  requestId: string,
  publicAppBaseUrl: string | null | undefined
): MessagingButton[][] | null {
  const base = publicAppBaseUrl?.trim()
  if (!base) return null
  const url = `${base.replace(/\/$/, '')}/appointment-requests?focus=${requestId}`
  return [[{ label: 'مشاهده در برنامه', url }]]
}

export async function handleApprovalCallback(
  input: CallbackInput
): Promise<CallbackOutcome> {
  const resolved = await resolveCaller(input)
  if (!resolved.ok) return resolved.outcome

  const staffId = await findSoleCapableStaffUserId(resolved.salonId, resolved.serviceId)
  if (!staffId) {
    return {
      messageHtml: '👉 برای انتخاب پرسنل، در برنامه باز کنید.',
      replacementKeyboard: openInAppKeyboard(input.requestId, input.publicAppBaseUrl),
      toast: 'انتخاب پرسنل در برنامه',
    }
  }

  const result = await approveAppointmentRequest({
    id: input.requestId,
    salonId: resolved.salonId,
    staffId,
    reviewedByUserId: resolved.caller.userId,
  })
  if (!result.ok) {
    if (result.status === 409) {
      return {
        messageHtml: '⚠️ این درخواست دیگر قابل تأیید نیست (احتمالاً قبلاً رسیدگی شده یا تداخل دارد).',
        replacementKeyboard: openInAppKeyboard(input.requestId, input.publicAppBaseUrl),
        toast: 'تأیید ممکن نیست',
      }
    }
    return {
      messageHtml: `⚠️ ${escapeHtml(result.error)}`,
      replacementKeyboard: openInAppKeyboard(input.requestId, input.publicAppBaseUrl),
      toast: 'خطا',
    }
  }

  const hm = salonCurrentHm()
  return {
    messageHtml: `✅ تأیید شد توسط ${escapeHtml(resolved.caller.displayName)} در ${hm}`,
    replacementKeyboard: null,
    toast: 'تأیید شد',
  }
}

export async function handleRejectionCallback(
  input: CallbackInput
): Promise<CallbackOutcome> {
  const resolved = await resolveCaller(input)
  if (!resolved.ok) return resolved.outcome

  const result = await rejectAppointmentRequest({
    id: input.requestId,
    salonId: resolved.salonId,
    reviewedByUserId: resolved.caller.userId,
    reason: 'rejected via Telegram',
  })
  if (!result.ok) {
    return {
      messageHtml: '⚠️ این درخواست دیگر قابل رد نیست.',
      replacementKeyboard: null,
      toast: 'رد ممکن نیست',
    }
  }

  const hm = salonCurrentHm()
  return {
    messageHtml: `❌ رد شد توسط ${escapeHtml(resolved.caller.displayName)} در ${hm}`,
    replacementKeyboard: null,
    toast: 'رد شد',
  }
}
