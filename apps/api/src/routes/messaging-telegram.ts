import { Hono } from 'hono'
import {
  answerTelegramCallback,
  editTelegramMessageText,
  getTelegramConfig,
  sendTelegramMessage,
} from '@repo/notifications'
import { messagingCommands } from '@repo/notifications'
import { getEnv } from '../env'
import type { AppEnv } from '../factory'
import { secureCompare } from '../lib/secure-compare'
import { ok } from '../lib/responses'

type TelegramUser = {
  id: number
  is_bot?: boolean
  first_name?: string
  last_name?: string
  username?: string
}

type TelegramChat = { id: number; type?: string }

type TelegramMessage = {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  text?: string
}

type TelegramCallbackQuery = {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  data?: string
}

type TelegramUpdate = {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

function displayNameFor(user: TelegramUser | undefined): string | null {
  if (!user) return null
  const handle = user.username ? `@${user.username}` : null
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return handle ?? (name.length > 0 ? name : null)
}

const START_TOKEN_RE = /^\/start(?:@\S+)?\s+([A-Za-z0-9-]+)\s*$/
const BARE_START_RE = /^\/start(?:@\S+)?\s*$/

function parseStartToken(text: string | undefined): string | null {
  if (!text) return null
  const m = text.match(START_TOKEN_RE)
  return m?.[1] ?? null
}

export const messagingTelegramRoute = new Hono<AppEnv>()
  .post('/webhook', async (c) => {
    const config = getTelegramConfig()
    if (!config) {
      return ok(c, { ok: true })
    }

    const provided = c.req.header('x-telegram-bot-api-secret-token')
    if (!secureCompare(config.webhookSecret, provided)) {
      // Always 200 to discourage probing; do nothing.
      return ok(c, { ok: true })
    }

    let update: TelegramUpdate
    try {
      update = (await c.req.json()) as TelegramUpdate
    } catch {
      return ok(c, { ok: true })
    }

    if (update.message) {
      const msg = update.message
      const startToken = parseStartToken(msg.text)
      if (startToken && msg.from) {
        const result = await messagingCommands.handleLinkStart({
          provider: 'telegram',
          token: startToken,
          externalId: String(msg.from.id),
          displayName: displayNameFor(msg.from),
        })
        await sendTelegramMessage({
          chatId: String(msg.chat.id),
          text: result.message,
        })
        return ok(c, { ok: true })
      }

      if (msg.text && BARE_START_RE.test(msg.text)) {
        await sendTelegramMessage({
          chatId: String(msg.chat.id),
          text: 'برای اتصال این حساب به آراویرا، از داخل برنامه روی «اتصال تلگرام» بزنید تا لینک اختصاصی برایتان ساخته شود.',
        })
        return ok(c, { ok: true })
      }
      // Anything else: 200 no-op.
      return ok(c, { ok: true })
    }

    if (update.callback_query) {
      const cq = update.callback_query
      const parsed = parseCallbackData(cq.data)
      if (!parsed || !cq.from || !cq.message) {
        await answerTelegramCallback({ callbackQueryId: cq.id })
        return ok(c, { ok: true })
      }

      const handler =
        parsed.action === 'approve'
          ? messagingCommands.handleApprovalCallback
          : messagingCommands.handleRejectionCallback
      const outcome = await handler({
        provider: 'telegram',
        externalId: String(cq.from.id),
        requestId: parsed.requestId,
        publicAppBaseUrl: getEnv().PUBLIC_APP_BASE_URL ?? null,
      })

      await answerTelegramCallback({
        callbackQueryId: cq.id,
        text: outcome.toast,
      })
      await editTelegramMessageText({
        chatId: String(cq.message.chat.id),
        messageId: cq.message.message_id,
        text: outcome.messageHtml,
        buttons: outcome.replacementKeyboard,
      })
      return ok(c, { ok: true })
    }

    return ok(c, { ok: true })
  })

const CALLBACK_DATA_RE = /^(approve|reject):([0-9a-f-]{8,})$/i

function parseCallbackData(
  data: string | undefined
): { action: 'approve' | 'reject'; requestId: string } | null {
  if (!data) return null
  const m = data.match(CALLBACK_DATA_RE)
  if (!m) return null
  return { action: m[1] as 'approve' | 'reject', requestId: m[2]! }
}

export type MessagingTelegramRoute = typeof messagingTelegramRoute
