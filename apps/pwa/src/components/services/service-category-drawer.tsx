import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@repo/ui/drawer'
import { Button } from '@repo/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@repo/ui/field'
import { Input } from '@repo/ui/input'
import { Spinner } from '@repo/ui/spinner'
import { useDismissGuard } from '#/lib/use-dismiss-guard'
import { serviceCategoryFormSchema } from '@repo/salon-core/forms/service'
import type { ServiceCategoryCreateInput } from '@repo/salon-core/forms/service'
import type { ServiceCategory } from '@repo/salon-core/types'
import { DataClientHttpError } from '@repo/data-client'
import { useManagerDataClient } from '#/lib/manager-data-client'

interface ServiceCategoryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: ServiceCategory | null
  onSuccess: () => void
}

function emptyValues(): ServiceCategoryCreateInput {
  return { name: '', active: true }
}

export function ServiceCategoryDrawer({
  open,
  onOpenChange,
  category,
  onSuccess,
}: ServiceCategoryDrawerProps) {
  const dc = useManagerDataClient()
  const isEditing = !!category
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ServiceCategoryCreateInput>({
    resolver: zodResolver(serviceCategoryFormSchema),
    defaultValues: emptyValues(),
  })

  useEffect(() => {
    if (!open) return
    reset(
      category
        ? { name: category.name, active: category.active }
        : emptyValues(),
    )
  }, [category, open, reset])

  const nameValue = useWatch({ control, name: 'name' })

  const saveCategory = useMutation({
    mutationFn: async (values: ServiceCategoryCreateInput) => {
      if (!dc) {
        throw new DataClientHttpError('اتصال داده برقرار نیست', 0, null)
      }
      const payload = serviceCategoryFormSchema.parse(values)
      if (isEditing) {
        await dc.services.categories.update(category.id, payload)
      } else {
        await dc.services.categories.create(payload)
      }
    },
    meta: { errorMessage: 'ذخیره بخش انجام نشد' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveCategory.mutateAsync(values)
      onSuccess()
    } catch {
      // Toast handled by mutation cache.
    }
  })

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

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEditing ? 'ویرایش بخش' : 'بخش جدید'}</DrawerTitle>
          <DrawerDescription>
            یک نام ساده مثل مو، ناخن یا پوست وارد کنید
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={onSubmit} className="p-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="service-category-name">نام بخش</FieldLabel>
              <Input id="service-category-name" {...register('name')} />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>
          </FieldGroup>
        </form>
        <DrawerFooter>
          <Button onClick={onSubmit} disabled={isSubmitting || !nameValue}>
            {isSubmitting && <Spinner className="ml-2" />}
            {isSubmitting ? '…' : isEditing ? 'ذخیره' : 'افزودن'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => requestClose(false)}
            disabled={isSubmitting}
          >
            انصراف
          </Button>
        </DrawerFooter>
      </DrawerContent>
      {confirmDialog}
    </Drawer>
  )
}
