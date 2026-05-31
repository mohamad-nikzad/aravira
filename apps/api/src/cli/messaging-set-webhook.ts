import { getEnv, isValidTelegramWebhookSecret, readTelegramConfigFromEnv } from '../env'

/**
 * Registers the Telegram bot webhook URL with the Bot API.
 *
 * Reads `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, and
 * `TELEGRAM_WEBHOOK_URL` from the environment. Run on every deploy where the
 * URL or secret changes:
 *
 *   pnpm --filter @repo/api cli:messaging-set-webhook
 */

async function main() {
  const env = getEnv()
  const config = readTelegramConfigFromEnv(env)
  const url = env.TELEGRAM_WEBHOOK_URL?.trim()
  if (!config || !url) {
    console.error(
      '[messaging-set-webhook] missing TELEGRAM_ENABLED config or TELEGRAM_WEBHOOK_URL'
    )
    process.exit(2)
  }
  const secret = config.webhookSecret
  if (!isValidTelegramWebhookSecret(secret)) {
    console.error(
      '[messaging-set-webhook] TELEGRAM_WEBHOOK_SECRET must be 1–256 chars using only A–Z, a–z, 0–9, underscore, or hyphen'
    )
    process.exit(2)
  }
  const res = await fetch(`https://api.telegram.org/bot${config.botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      secret_token: secret,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: false,
    }),
  })
  const body = await res.text()
  if (!res.ok) {
    console.error(`[messaging-set-webhook] failed (${res.status}): ${body}`)
    process.exit(1)
  }
  console.log(`[messaging-set-webhook] ok: ${body}`)
}

main().catch((err) => {
  console.error('[messaging-set-webhook] error:', err)
  process.exit(1)
})
