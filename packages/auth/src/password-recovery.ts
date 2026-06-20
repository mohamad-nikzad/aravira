import { randomBytes } from 'node:crypto'
import { and, eq, lt } from 'drizzle-orm'
import { getDb } from '@repo/database/client'
import { user, verification } from '@repo/database/schema'
import {
  AUTH_OTP_ALLOWED_ATTEMPTS,
  normalizeAuthPhoneNumber,
  verifyBypassAuthPhoneOtp,
} from './phone-otp'

const RESET_TOKEN_EXPIRES_IN_MS = 10 * 60 * 1000

export type PasswordRecoveryErrorCode =
  | 'OTP_NOT_FOUND'
  | 'OTP_EXPIRED'
  | 'INVALID_OTP'
  | 'TOO_MANY_ATTEMPTS'

export class PasswordRecoveryError extends Error {
  constructor(public readonly code: PasswordRecoveryErrorCode) {
    super(code)
    this.name = 'PasswordRecoveryError'
  }
}

/**
 * Consumes Better Auth's phone reset OTP and exchanges it for the token shape
 * accepted by Better Auth's core `/reset-password` endpoint.
 */
export async function exchangePasswordResetOtp(input: {
  phoneNumber: string
  otp: string
}): Promise<string> {
  const phoneNumber = normalizeAuthPhoneNumber(input.phoneNumber)
  const otpIdentifier = `${phoneNumber}-request-password-reset`
  const db = getDb()

  return db.transaction(async (tx) => {
    const rows = await tx
      .select({ value: verification.value, expiresAt: verification.expiresAt })
      .from(verification)
      .where(eq(verification.identifier, otpIdentifier))
      .limit(1)
    const stored = rows[0]

    if (!stored) throw new PasswordRecoveryError('OTP_NOT_FOUND')
    if (stored.expiresAt < new Date()) {
      await tx
        .delete(verification)
        .where(eq(verification.identifier, otpIdentifier))
      throw new PasswordRecoveryError('OTP_EXPIRED')
    }

    const [expectedOtp = '', attemptsText = '0'] = stored.value.split(':')
    const attempts = Number.parseInt(attemptsText, 10) || 0
    if (attempts >= AUTH_OTP_ALLOWED_ATTEMPTS) {
      await tx
        .delete(verification)
        .where(eq(verification.identifier, otpIdentifier))
      throw new PasswordRecoveryError('TOO_MANY_ATTEMPTS')
    }

    const valid =
      input.otp === expectedOtp || verifyBypassAuthPhoneOtp({ code: input.otp })
    if (!valid) {
      const nextAttempts = attempts + 1
      if (nextAttempts >= AUTH_OTP_ALLOWED_ATTEMPTS) {
        await tx
          .delete(verification)
          .where(eq(verification.identifier, otpIdentifier))
        throw new PasswordRecoveryError('TOO_MANY_ATTEMPTS')
      }
      await tx
        .update(verification)
        .set({ value: `${expectedOtp}:${nextAttempts}`, updatedAt: new Date() })
        .where(
          and(
            eq(verification.identifier, otpIdentifier),
            eq(verification.value, stored.value),
          ),
        )
      throw new PasswordRecoveryError('INVALID_OTP')
    }

    const users = await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.phoneNumber, phoneNumber))
      .limit(1)
    const accountUser = users[0]
    if (!accountUser) {
      await tx
        .delete(verification)
        .where(eq(verification.identifier, otpIdentifier))
      throw new PasswordRecoveryError('INVALID_OTP')
    }

    const consumed = await tx
      .delete(verification)
      .where(
        and(
          eq(verification.identifier, otpIdentifier),
          eq(verification.value, stored.value),
        ),
      )
      .returning({ id: verification.id })
    if (!consumed[0]) throw new PasswordRecoveryError('OTP_NOT_FOUND')

    const token = randomBytes(32).toString('base64url')
    await tx.insert(verification).values({
      identifier: `reset-password:${token}`,
      value: accountUser.id,
      expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRES_IN_MS),
    })
    await tx
      .delete(verification)
      .where(
        and(
          lt(verification.expiresAt, new Date()),
          eq(verification.value, accountUser.id),
        ),
      )

    return token
  })
}
