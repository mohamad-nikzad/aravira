'use client'

import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@repo/ui/drawer'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Field, FieldLabel, FieldGroup, FieldError } from '@repo/ui/field'
import { FormRootError } from '@repo/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select'
import { Spinner } from '@repo/ui/spinner'
import {
  Service,
  SERVICE_CATEGORIES,
  STAFF_COLORS,
} from '@repo/salon-core/types'
import { normalizeCalendarColorId } from '@repo/salon-core/calendar-colors'
import { calendarColorOptions } from '@repo/brand-tokens/calendar-colors'
import {
  parseLocalizedInt,
  toPersianDigits,
} from '@repo/salon-core/persian-digits'
import {
  serviceFormSchema,
  type ServiceFormInput,
} from '@repo/salon-core/forms/service'
import { DataClientHttpError } from '@repo/data-client'
import { useManagerDataClient } from '@/components/manager-data-client-provider'

interface ServiceDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: Service | null
  onSuccess: () => void
}

function emptyValues(): ServiceFormInput {
  return {
    name: '',
    category: 'hair',
    duration: 45,
    price: 0,
    color: STAFF_COLORS[0],
    active: true,
  }
}

function serviceToFormValues(service: Service): ServiceFormInput {
  return {
    name: service.name,
    category: service.category,
    duration: service.duration,
    price: service.price,
    color: normalizeCalendarColorId(service.color),
    active: service.active,
  }
}

export function ServiceDrawer({
  open,
  onOpenChange,
  service,
  onSuccess,
}: ServiceDrawerProps) {
  const dc = useManagerDataClient()
  const isEditing = !!service
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormInput>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: emptyValues(),
    mode: 'onSubmit',
  })

  useEffect(() => {
    if (!open) return
    reset(service ? serviceToFormValues(service) : emptyValues())
  }, [open, reset, service])

  const nameValue = watch('name')

  const onSubmit = handleSubmit(async (values) => {
    if (!dc) {
      setError('root', { message: 'اتصال داده برقرار نیست' })
      return
    }

    try {
      const payload = serviceFormSchema.parse(values)
      if (isEditing) {
        await dc.services.update(service.id, {
          ...payload,
          color: normalizeCalendarColorId(payload.color),
        })
      } else {
        await dc.services.create({
          ...payload,
          color: normalizeCalendarColorId(payload.color),
        })
      }
      onSuccess()
    } catch (err) {
      const msg =
        err instanceof DataClientHttpError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'خطایی رخ داد'
      setError('root', { message: msg })
    }
  })

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEditing ? 'ویرایش خدمت' : 'خدمت جدید'}</DrawerTitle>
          <DrawerDescription>نام، مدت و قیمت را مشخص کنید</DrawerDescription>
        </DrawerHeader>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 overflow-auto px-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="svc-name">نام خدمت</FieldLabel>
              <Input id="svc-name" {...register('name')} />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>دسته</FieldLabel>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select
                    value={field.value ?? 'hair'}
                    onValueChange={(v) =>
                      field.onChange(v as ServiceFormInput['category'])
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.keys(
                          SERVICE_CATEGORIES,
                        ) as (keyof typeof SERVICE_CATEGORIES)[]
                      ).map((k) => (
                        <SelectItem key={k} value={k}>
                          {SERVICE_CATEGORIES[k].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <FieldError>{errors.category.message}</FieldError>
              )}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="svc-dur">مدت (دقیقه)</FieldLabel>
                <Controller
                  control={control}
                  name="duration"
                  render={({ field }) => (
                    <Input
                      id="svc-dur"
                      type="text"
                      inputMode="numeric"
                      value={toPersianDigits(field.value)}
                      onChange={(e) =>
                        field.onChange(
                          Math.max(
                            5,
                            parseLocalizedInt(
                              e.target.value,
                              Number(field.value) || 45,
                            ),
                          ),
                        )
                      }
                      onBlur={field.onBlur}
                      dir="rtl"
                      className="text-right tabular-nums"
                    />
                  )}
                />
                {errors.duration && (
                  <FieldError>{errors.duration.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="svc-price">قیمت (تومان)</FieldLabel>
                <Controller
                  control={control}
                  name="price"
                  render={({ field }) => (
                    <Input
                      id="svc-price"
                      type="text"
                      inputMode="numeric"
                      value={toPersianDigits(field.value)}
                      onChange={(e) =>
                        field.onChange(
                          Math.max(
                            0,
                            parseLocalizedInt(
                              e.target.value,
                              Number(field.value) || 0,
                            ),
                          ),
                        )
                      }
                      onBlur={field.onBlur}
                      dir="rtl"
                      className="text-right tabular-nums"
                    />
                  )}
                />
                {errors.price && (
                  <FieldError>{errors.price.message}</FieldError>
                )}
              </Field>
            </div>
            <Field>
              <FieldLabel>رنگ در تقویم</FieldLabel>
              <Controller
                control={control}
                name="color"
                render={({ field }) => (
                  <Select
                    value={normalizeCalendarColorId(field.value)}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {calendarColorOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <span className="flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="size-3 rounded-full border border-border"
                              style={{
                                backgroundColor: `var(--calendar-${option.id})`,
                              }}
                            />
                            <span>{option.labelFa}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.color && <FieldError>{errors.color.message}</FieldError>}
            </Field>
            {isEditing && (
              <Field>
                <FieldLabel>وضعیت</FieldLabel>
                <Controller
                  control={control}
                  name="active"
                  render={({ field }) => (
                    <Select
                      value={field.value ? 'on' : 'off'}
                      onValueChange={(v) => field.onChange(v === 'on')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on">فعال</SelectItem>
                        <SelectItem value="off">غیرفعال</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            )}
            <FormRootError message={errors.root?.message} />
          </FieldGroup>
        </form>

        <DrawerFooter>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !nameValue}
            className="touch-manipulation"
          >
            {isSubmitting && <Spinner className="ml-2" />}
            {isSubmitting ? '…' : isEditing ? 'ذخیره' : 'افزودن'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">انصراف</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
