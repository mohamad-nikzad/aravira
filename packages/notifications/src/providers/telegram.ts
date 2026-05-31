import type {
  MessagingButton,
  MessagingDeliveryResult,
  MessagingProvider,
  MessagingSendInput,
} from './types'

export type TelegramConfig = {
  botToken: string
  botUsername: string
  webhookSecret: string
}

type InlineKeyboardButton = { text: string } & ({ url: string } | { callback_data: string })
type InlineKeyboard = { inline_keyboard: Array<Array<InlineKeyboardButton>> }

let resolveConfig: () => TelegramConfig | null = () => null

export function initTelegramMessaging(getConfig: () => TelegramConfig | null): void {
  resolveConfig = getConfig
}

function getTelegramConfig(): TelegramConfig | null {
  return resolveConfig()
}

function toInlineKeyboard(rows: MessagingButton[][] | undefined): InlineKeyboard | undefined {
  if (!rows || rows.length === 0) return undefined
  return {
    inline_keyboard: rows.map((row) =>
      row.map((b): InlineKeyboardButton =>
        b.url
          ? { text: b.label, url: b.url }
          : { text: b.label, callback_data: b.data ?? '' }
      )
    ),
  }
}

async function postToTelegram(
  config: TelegramConfig,
  method: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; status: number; body: unknown; text: string }> {
  const response = await fetch(`https://api.telegram.org/bot${config.botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const text = await response.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  return { ok: response.ok, status: response.status, body, text }
}

export async function sendTelegramMessage(input: {
  chatId: string
  text: string
  buttons?: MessagingButton[][]
}): Promise<MessagingDeliveryResult> {
  const config = getTelegramConfig()
  if (!config) {
    return { status: 'skipped', error: 'telegram_not_configured' }
  }
  const payload: Record<string, unknown> = {
    chat_id: input.chatId,
    text: input.text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  }
  const keyboard = toInlineKeyboard(input.buttons)
  if (keyboard) payload.reply_markup = keyboard

  try {
    const res = await postToTelegram(config, 'sendMessage', payload)
    if (!res.ok) {
      console.error('[messaging.send.failed]', {
        provider: 'telegram',
        status: res.status,
        body: res.text.slice(0, 1024),
      })
      return {
        status: 'failed',
        error: res.text.slice(0, 1024) || `telegram_http_${res.status}`,
      }
    }
    const messageId = extractMessageId(res.body)
    return { status: 'sent', providerMessageId: messageId }
  } catch (err) {
    return {
      status: 'failed',
      error: err instanceof Error ? err.message : 'telegram_send_error',
    }
  }
}

export async function editTelegramMessageText(input: {
  chatId: string
  messageId: number
  text: string
  buttons?: MessagingButton[][] | null
}): Promise<void> {
  const config = getTelegramConfig()
  if (!config) return
  const payload: Record<string, unknown> = {
    chat_id: input.chatId,
    message_id: input.messageId,
    text: input.text,
    parse_mode: 'HTML',
  }
  if (input.buttons && input.buttons.length > 0) {
    const keyboard = toInlineKeyboard(input.buttons)
    if (keyboard) payload.reply_markup = keyboard
  } else if (input.buttons === null) {
    payload.reply_markup = { inline_keyboard: [] }
  }
  const res = await postToTelegram(config, 'editMessageText', payload).catch(() => null)
  if (res && !res.ok) {
    console.error('[messaging.edit.failed]', {
      provider: 'telegram',
      status: res.status,
      body: res.text.slice(0, 1024),
    })
  }
}

export async function answerTelegramCallback(input: {
  callbackQueryId: string
  text?: string
}): Promise<void> {
  const config = getTelegramConfig()
  if (!config) return
  const payload: Record<string, unknown> = { callback_query_id: input.callbackQueryId }
  if (input.text) payload.text = input.text
  await postToTelegram(config, 'answerCallbackQuery', payload).catch(() => {})
}

function extractMessageId(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const result = (body as { result?: unknown }).result
  if (!result || typeof result !== 'object') return null
  const id = (result as { message_id?: unknown }).message_id
  return typeof id === 'number' ? String(id) : null
}

export function createTelegramProvider(
  getConfig: () => TelegramConfig | null = resolveConfig
): MessagingProvider {
  return {
    id: 'telegram',
    displayName: 'Telegram',
    supportsInlineButtons: true,
    supportsInbound: true,
    isConfigured(): boolean {
      return getConfig() !== null
    },
    buildAccountLinkUrl(token: string): string | null {
      const config = getConfig()
      const username = config?.botUsername?.trim()
      if (!username) return null
      return `https://t.me/${username}?start=${token}`
    },
    async send(input: MessagingSendInput): Promise<MessagingDeliveryResult> {
      const text = input.title
        ? `<b>${escapeHtml(input.title)}</b>\n${escapeHtml(input.body)}`
        : escapeHtml(input.body)
      const config = getConfig()
      if (!config) {
        return { status: 'skipped', error: 'telegram_not_configured' }
      }
      const payload: Record<string, unknown> = {
        chat_id: input.externalId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }
      const keyboard = toInlineKeyboard(input.buttons)
      if (keyboard) payload.reply_markup = keyboard

      try {
        const res = await postToTelegram(config, 'sendMessage', payload)
        if (!res.ok) {
          console.error('[messaging.send.failed]', {
            provider: 'telegram',
            status: res.status,
            body: res.text.slice(0, 1024),
          })
          return {
            status: 'failed',
            error: res.text.slice(0, 1024) || `telegram_http_${res.status}`,
          }
        }
        const messageId = extractMessageId(res.body)
        return { status: 'sent', providerMessageId: messageId }
      } catch (err) {
        return {
          status: 'failed',
          error: err instanceof Error ? err.message : 'telegram_send_error',
        }
      }
    },
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export { getTelegramConfig }
