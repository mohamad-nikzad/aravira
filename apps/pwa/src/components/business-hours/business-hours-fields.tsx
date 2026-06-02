import { Clock3 } from 'lucide-react'
import { TimePicker } from '@repo/ui/time-picker'
import { Field, FieldError, FieldGroup, FieldLabel } from '@repo/ui/field'
import { toPersianDigits } from '@repo/salon-core/persian-digits'

import { WorkingDaysPills } from './working-days-pills'

type BusinessHoursFieldsProps = {
  workingStart: string
  workingEnd: string
  slotDurationMinutes: number
  workingDays: number
  onWorkingStartChange: (value: string) => void
  onWorkingEndChange: (value: string) => void
  onSlotDurationChange: (value: number) => void
  onWorkingDaysChange: (value: number) => void
  errors?: {
    workingStart?: { message?: string }
    workingEnd?: { message?: string }
    slotDurationMinutes?: { message?: string }
    workingDays?: { message?: string }
  }
  variant?: 'onboarding' | 'settings'
}

function SlotDurationStepper({
  slotDurationMinutes,
  onSlotDurationChange,
}: Pick<
  BusinessHoursFieldsProps,
  'slotDurationMinutes' | 'onSlotDurationChange'
>) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line-soft bg-card p-3.5">
      <Clock3 className="size-5 text-primary" />
      <span className="flex-1 text-sm font-semibold text-foreground">
        هر نوبت در بازه‌های
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="کاهش"
          onClick={() =>
            onSlotDurationChange(Math.max(5, slotDurationMinutes - 5))
          }
          className="flex size-8 items-center justify-center rounded-lg bg-blush-soft text-base font-bold text-primary"
        >
          −
        </button>
        <span className="min-w-14 text-center text-sm font-extrabold tabular-nums text-primary">
          {toPersianDigits(slotDurationMinutes)} دقیقه
        </span>
        <button
          type="button"
          aria-label="افزایش"
          onClick={() => onSlotDurationChange(slotDurationMinutes + 5)}
          className="flex size-8 items-center justify-center rounded-lg bg-blush-soft text-base font-bold text-primary"
        >
          +
        </button>
      </div>
    </div>
  )
}

export function BusinessHoursFields({
  workingStart,
  workingEnd,
  slotDurationMinutes,
  workingDays,
  onWorkingStartChange,
  onWorkingEndChange,
  onSlotDurationChange,
  onWorkingDaysChange,
  errors,
  variant = 'onboarding',
}: BusinessHoursFieldsProps) {
  const timeFields =
    variant === 'settings' ? (
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel>شروع</FieldLabel>
          <TimePicker
            value={workingStart}
            onChange={onWorkingStartChange}
            label="ساعت شروع"
          />
          {errors?.workingStart && (
            <FieldError>{errors.workingStart.message}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel>پایان</FieldLabel>
          <TimePicker
            value={workingEnd}
            onChange={onWorkingEndChange}
            label="ساعت پایان"
          />
          {errors?.workingEnd && (
            <FieldError>{errors.workingEnd.message}</FieldError>
          )}
        </Field>
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-sage-deep">از ساعت</span>
          <TimePicker
            value={workingStart}
            onChange={onWorkingStartChange}
            label="ساعت شروع"
          />
          {errors?.workingStart && (
            <FieldError>{errors.workingStart.message}</FieldError>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-sage-deep">تا ساعت</span>
          <TimePicker
            value={workingEnd}
            onChange={onWorkingEndChange}
            label="ساعت پایان"
          />
          {errors?.workingEnd && (
            <FieldError>{errors.workingEnd.message}</FieldError>
          )}
        </div>
      </div>
    )

  const workingDaysBlock =
    variant === 'settings' ? (
      <Field>
        <FieldLabel>روزهای کاری</FieldLabel>
        <WorkingDaysPills
          workingDays={workingDays}
          onWorkingDaysChange={onWorkingDaysChange}
        />
        {errors?.workingDays && (
          <FieldError>{errors.workingDays.message}</FieldError>
        )}
      </Field>
    ) : (
      <>
        <WorkingDaysPills
          workingDays={workingDays}
          onWorkingDaysChange={onWorkingDaysChange}
        />
        {errors?.workingDays && (
          <FieldError>{errors.workingDays.message}</FieldError>
        )}
      </>
    )

  const slotBlock =
    variant === 'settings' ? (
      <Field>
        <FieldLabel>فاصله اسلات (دقیقه)</FieldLabel>
        <SlotDurationStepper
          slotDurationMinutes={slotDurationMinutes}
          onSlotDurationChange={onSlotDurationChange}
        />
        {errors?.slotDurationMinutes && (
          <FieldError>{errors.slotDurationMinutes.message}</FieldError>
        )}
      </Field>
    ) : (
      <>
        <SlotDurationStepper
          slotDurationMinutes={slotDurationMinutes}
          onSlotDurationChange={onSlotDurationChange}
        />
        {errors?.slotDurationMinutes && (
          <FieldError>{errors.slotDurationMinutes.message}</FieldError>
        )}
      </>
    )

  if (variant === 'settings') {
    return (
      <FieldGroup className="gap-3">
        {workingDaysBlock}
        {timeFields}
        {slotBlock}
      </FieldGroup>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {workingDaysBlock}
      {timeFields}
      {slotBlock}
    </div>
  )
}
