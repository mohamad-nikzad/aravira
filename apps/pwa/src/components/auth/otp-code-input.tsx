import { InputOTP, InputOTPGroup, InputOTPSlot } from '@repo/ui/input-otp'
import { cn } from '@repo/ui/utils'

import { AUTH_OTP_CODE_LENGTH, normalizeOtpCode } from '#/lib/auth-otp'

type OtpCodeInputProps = {
  id?: string
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  slotClassName?: string
}

export function OtpCodeInput({
  id = 'otp',
  value,
  onValueChange,
  disabled,
  invalid,
  slotClassName,
}: OtpCodeInputProps) {
  return (
    <div dir="ltr" className="flex justify-center">
      <InputOTP
        id={id}
        maxLength={AUTH_OTP_CODE_LENGTH}
        value={value}
        onChange={(nextValue) => onValueChange(normalizeOtpCode(nextValue))}
        inputMode="numeric"
        autoComplete="one-time-code"
        disabled={disabled}
        containerClassName="justify-center gap-2"
      >
        <InputOTPGroup className="gap-2">
          {Array.from({ length: AUTH_OTP_CODE_LENGTH }, (_, index) => (
            <InputOTPSlot
              key={index}
              index={index}
              aria-invalid={invalid}
              className={cn(
                'rounded-xl border text-lg font-bold',
                slotClassName,
              )}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}
