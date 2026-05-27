import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  FormSheet,
  FormSheetContent,
  FormSheetHeader,
  FormSheetTitle,
  FormSheetDescription,
  FormSheetFooter,
} from '#/components/form-sheet'
import { useDismissGuard } from '#/lib/use-dismiss-guard'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Field, FieldLabel, FieldGroup, FieldError } from '@repo/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select'
import { Spinner } from '@repo/ui/spinner'
import { displayPhone, normalizePhone } from '@repo/salon-core/phone'
import { staffCreateSchema } from '@repo/salon-core/forms/staff'
import type { StaffCreateFormInput } from '@repo/salon-core/forms/staff'
import { DataClientHttpError } from '@repo/data-client'
import { runMutation } from '#/lib/run-mutation'
import { api } from '#/lib/api-client'

interface StaffDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  roleLocked?: 'staff' | 'manager'
}

function emptyValues(roleLocked?: 'staff' | 'manager'): StaffCreateFormInput {
  return { name: '', phone: '', password: '', role: roleLocked ?? 'staff' }
}

export function StaffDrawer({
  open,
  onOpenChange,
  onSuccess,
  roleLocked,
}: StaffDrawerProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<StaffCreateFormInput>({
    resolver: zodResolver(staffCreateSchema),
    defaultValues: emptyValues(roleLocked),
    mode: 'onSubmit',
  })

  useEffect(() => {
    if (open) reset(emptyValues(roleLocked))
  }, [open, roleLocked, reset])

  const nameValue = watch('name')
  const phoneValue = watch('phone')
  const passwordValue = watch('password')

  const { requestClose, confirmDialog } = useDismissGuard({
    isDirty: isDirty && !isSubmitting,
    onClose: () => onOpenChange(false),
  })

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      onOpenChange(true)
      return
    }
    requestClose(false)
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = await runMutation(async () => {
      try {
        await api.staff.create({
          ...values,
          role: roleLocked ?? values.role ?? 'staff',
        })
      } catch (error) {
        if (error instanceof Error) {
          throw new DataClientHttpError(
            error.message || 'افزودن پرسنل انجام نشد',
            0,
            null,
          )
        }
        throw error
      }
    })

    if (result.ok) onSuccess()
  })

  return (
    <FormSheet open={open} onOpenChange={handleOpenChange}>
      <FormSheetContent onRequestClose={() => requestClose(false)}>
        <FormSheetHeader>
          <FormSheetTitle>پرسنل جدید</FormSheetTitle>
          <FormSheetDescription>
            عضو جدیدی به تیم سالن اضافه کنید
          </FormSheetDescription>
        </FormSheetHeader>

        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="staff-name">نام و نام خانوادگی</FieldLabel>
              <Input
                id="staff-name"
                placeholder="مثال: نرگس کاظمی"
                {...register('name')}
              />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="staff-phone">شماره موبایل</FieldLabel>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <Input
                    id="staff-phone"
                    type="tel"
                    value={displayPhone(field.value)}
                    onChange={(e) =>
                      field.onChange(normalizePhone(e.target.value))
                    }
                    onBlur={field.onBlur}
                    placeholder="۰۹۱۲…"
                    dir="ltr"
                    className="text-left tabular-nums"
                  />
                )}
              />
              {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="staff-password">رمز عبور</FieldLabel>
              <Input
                id="staff-password"
                type="password"
                placeholder="رمز ورود به سیستم"
                {...register('password')}
              />
              {errors.password && (
                <FieldError>{errors.password.message}</FieldError>
              )}
            </Field>

            {roleLocked ? (
              <Field>
                <FieldLabel>نقش</FieldLabel>
                <Input
                  value={roleLocked === 'staff' ? 'پرسنل' : 'مدیر'}
                  disabled
                />
              </Field>
            ) : (
              <Field>
                <FieldLabel>نقش</FieldLabel>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? 'staff'}
                      onValueChange={(v) => field.onChange(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">پرسنل</SelectItem>
                        <SelectItem value="manager">مدیر</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            )}
          </FieldGroup>
        </form>

        <FormSheetFooter>
          <Button
            onClick={onSubmit}
            disabled={
              isSubmitting || !nameValue || !phoneValue || !passwordValue
            }
            className="touch-manipulation"
          >
            {isSubmitting && <Spinner className="ml-2" />}
            {isSubmitting ? 'در حال افزودن…' : 'افزودن پرسنل'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => requestClose(false)}
            disabled={isSubmitting}
          >
            انصراف
          </Button>
        </FormSheetFooter>
      </FormSheetContent>
      {confirmDialog}
    </FormSheet>
  )
}
