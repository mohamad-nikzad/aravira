import { Hono } from 'hono'
import {
  REPLY_KEYBOARD_LABELS,
  answerBaleCallback,
  editBaleMessageReplyMarkup,
  editBaleMessageText,
  getBaleConfig,
  messagingCommands,
  persistentReplyKeyboard,
  renderBaleBotHtml,
  sendBaleMessage,
} from '@repo/notifications'
import { getEnv, getMessagingAppBaseUrl } from '../env'
import type { AppEnv } from '../factory'
import { secureCompare } from '../lib/secure-compare'
import { ok } from '../lib/responses'

type BaleUser = {
  id: number | string
  username?: string
  first_name?: string
  last_name?: string
}

type BaleMessage = {
  message_id: number
  from?: BaleUser
  chat: { id: number | string }
  text?: string
}

type BaleCallbackQuery = {
  id: string
  from?: BaleUser
  message?: BaleMessage
  data?: string
}

type BaleUpdate = {
  message?: BaleMessage
  callback_query?: BaleCallbackQuery
}

function displayNameFor(user: BaleUser | undefined): string | null {
  if (!user) return null
  const handle = user.username ? `@${user.username}` : null
  const name = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(' ')
    .trim()
  return handle ?? (name.length > 0 ? name : null)
}

const START_TOKEN_RE = /^\/start(?:@\S+)?\s+([A-Za-z0-9-]+)\s*$/
const BARE_START_RE = /^\/start(?:@\S+)?\s*$/
const COMMAND_RE = /^\/([A-Za-z]+)(?:@\S+)?\s*$/

function parseStartToken(text: string | undefined): string | null {
  if (!text) return null
  const m = text.match(START_TOKEN_RE)
  return m?.[1] ?? null
}

function settingsDeepLinkMessage(): string {
  const base = getEnv().PUBLIC_APP_BASE_URL?.replace(/\/$/, '')
  const link = base ? `${base}/settings/notifications` : null
  return link
    ? `تنظیمات اعلان‌ها: ${link}`
    : 'تنظیمات اعلان‌ها در داخل برنامه آراویرا قابل دسترسی است.'
}

async function sendBotTextResult(
  chatId: string,
  result: messagingCommands.BotTextResult,
): Promise<void> {
  for (const msg of result.messages) {
    await sendBaleMessage({
      chatId,
      text: renderBaleBotHtml(msg.messageHtml),
      buttons: msg.buttons,
    })
  }
}

type CommandKind = 'pending' | 'today' | 'unlink' | 'help' | 'settings'

function matchCommand(text: string): CommandKind | null {
  const trimmed = text.trim()
  if (trimmed === REPLY_KEYBOARD_LABELS.pending) return 'pending'
  if (trimmed === REPLY_KEYBOARD_LABELS.today) return 'today'
  if (trimmed === REPLY_KEYBOARD_LABELS.notificationSettings) return 'settings'
  const m = trimmed.match(COMMAND_RE)
  if (!m) return null
  const name = m[1]!.toLowerCase()
  if (name === 'pending') return 'pending'
  if (name === 'today') return 'today'
  if (name === 'unlink') return 'unlink'
  if (name === 'help' || name === 'start')
    return name === 'help' ? 'help' : null
  return null
}

export const messagingBaleRoute = new Hono<AppEnv>().post(
  '/webhook/:secret',
  async (c) => {
    const config = getBaleConfig()
    if (!config) {
      return ok(c, { ok: true })
    }

    const provided = c.req.param('secret')
    if (!secureCompare(config.webhookSecret, provided)) {
      // Always 200 to discourage probing; do nothing.
      return ok(c, { ok: true })
    }

    let update: BaleUpdate
    try {
      update = (await c.req.json()) as BaleUpdate
    } catch {
      return ok(c, { ok: true })
    }

    if (update.message) {
      const msg = update.message
      const chatId = String(msg.chat.id)
      const text = msg.text

      const startToken = parseStartToken(text)
      if (startToken && msg.from) {
        const result = await messagingCommands.handleLinkStart({
          provider: 'bale',
          token: startToken,
          externalId: String(msg.from.id),
          displayName: displayNameFor(msg.from),
        })
        if (result.status === 'ok') {
          await sendBaleMessage({
            chatId,
            text: result.message,
            replyMarkup: persistentReplyKeyboard() as unknown as Record<
              string,
              unknown
            >,
          })
        } else {
          await sendBaleMessage({ chatId, text: result.message })
        }
        return ok(c, { ok: true })
      }

      if (text && BARE_START_RE.test(text)) {
        await sendBaleMessage({
          chatId,
          text: 'برای اتصال این حساب به آراویرا، از داخل برنامه روی «اتصال بله» بزنید تا لینک اختصاصی برایتان ساخته شود.',
        })
        return ok(c, { ok: true })
      }

      if (text) {
        const kind = matchCommand(text)
        const externalId = msg.from ? String(msg.from.id) : null
        if (kind === 'help') {
          await sendBotTextResult(chatId, messagingCommands.handleHelpCommand())
          return ok(c, { ok: true })
        }
        if (kind === 'settings') {
          await sendBaleMessage({ chatId, text: settingsDeepLinkMessage() })
          return ok(c, { ok: true })
        }
        if (kind && externalId) {
          if (kind === 'pending') {
            const result = await messagingCommands.handlePendingCommand({
              provider: 'bale',
              externalId,
              publicAppBaseUrl: getMessagingAppBaseUrl(),
            })
            await sendBotTextResult(chatId, result)
            return ok(c, { ok: true })
          }
          if (kind === 'today') {
            const result = await messagingCommands.handleTodayCommand({
              provider: 'bale',
              externalId,
            })
            await sendBotTextResult(chatId, result)
            return ok(c, { ok: true })
          }
          if (kind === 'unlink') {
            const result = await messagingCommands.handleUnlink({
              provider: 'bale',
              externalId,
            })
            await sendBaleMessage({ chatId, text: result.message })
            return ok(c, { ok: true })
          }
        }
      }

      return ok(c, { ok: true })
    }

    if (update.callback_query) {
      const cq = update.callback_query
      const message = cq.message
      const parsed = parseCallbackData(cq.data)
      if (!parsed || !cq.from || !message) {
        await answerBaleCallback({ callbackQueryId: cq.id })
        return ok(c, { ok: true })
      }

      const publicAppBaseUrl = getMessagingAppBaseUrl()
      const base = {
        provider: 'bale' as const,
        externalId: String(cq.from.id),
        requestId: parsed.requestId,
        publicAppBaseUrl,
      }
      const outcome =
        parsed.action === 'asg'
          ? await messagingCommands.handleAssignCallback({
              ...base,
              staffIndex: parsed.staffIndex,
            })
          : parsed.action === 'reject'
            ? await messagingCommands.handleRejectionCallback(base)
            : parsed.action === 'back'
              ? await messagingCommands.handleBackCallback(base)
              : await messagingCommands.handleApprovalCallback(base)

      await answerBaleCallback({
        callbackQueryId: cq.id,
        text: outcome.toast,
      })
      if (outcome.mode === 'markup') {
        await editBaleMessageReplyMarkup({
          chatId: String(message.chat.id),
          messageId: message.message_id,
          buttons: outcome.replacementKeyboard,
        })
      } else {
        await editBaleMessageText({
          chatId: String(message.chat.id),
          messageId: message.message_id,
          text: renderBaleBotHtml(outcome.messageHtml),
          buttons: outcome.replacementKeyboard,
        })
      }
      return ok(c, { ok: true })
    }

    return ok(c, { ok: true })
  },
)

const CALLBACK_DATA_RE = /^(approve|reject|back):([0-9a-f-]{8,})$/i
const ASSIGN_DATA_RE = /^asg:([0-9a-f-]{8,}):(\d+)$/i

type ParsedCallback =
  | { action: 'approve' | 'reject' | 'back'; requestId: string }
  | { action: 'asg'; requestId: string; staffIndex: number }

function parseCallbackData(data: string | undefined): ParsedCallback | null {
  if (!data) return null
  const assign = data.match(ASSIGN_DATA_RE)
  if (assign) {
    return {
      action: 'asg',
      requestId: assign[1]!,
      staffIndex: Number(assign[2]!),
    }
  }
  const m = data.match(CALLBACK_DATA_RE)
  if (!m) return null
  return {
    action: m[1]!.toLowerCase() as 'approve' | 'reject' | 'back',
    requestId: m[2]!,
  }
}

export type MessagingBaleRoute = typeof messagingBaleRoute
