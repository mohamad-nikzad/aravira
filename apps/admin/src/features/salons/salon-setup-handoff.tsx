import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Link2, Save } from 'lucide-react'
import {
  getApiV1AdminSalonsByIdQueryKey,
  patchApiV1AdminSalonsByIdSetupOwnerPhoneMutation,
  postApiV1AdminSalonsByIdSetupHandoffMutation,
} from '@repo/api-client/query'

import {
  CheckboxField,
  FormField,
  TextAreaField,
} from '#/components/admin/form-field'
import {
  LiveConfirmationInput,
  LiveDataWarning,
  liveConfirmationFromForm,
} from '#/components/admin/live-data-form'
import { MutationError } from '#/components/admin/mutation-error'
import { Panel } from '#/components/admin/panel'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'

export function SalonSetupHandoff({
  salonId,
  intendedOwnerPhone,
  isLiveData,
}: {
  salonId: string
  intendedOwnerPhone: string
  isLiveData: boolean
}) {
  const queryClient = useQueryClient()
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)
  const phoneMutation = useMutation({
    ...patchApiV1AdminSalonsByIdSetupOwnerPhoneMutation(),
    onSuccess: () => {
      setLink('')
      setCopied(false)
      void queryClient.invalidateQueries({
        queryKey: getApiV1AdminSalonsByIdQueryKey({ path: { id: salonId } }),
      })
    },
  })
  const handoffMutation = useMutation({
    ...postApiV1AdminSalonsByIdSetupHandoffMutation(),
    onSuccess: async (data) => {
      setLink(data.url)
      try {
        await navigator.clipboard.writeText(data.url)
        setCopied(true)
      } catch {
        setCopied(false)
      }
    },
  })

  function savePhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    phoneMutation.mutate({
      path: { id: salonId },
      body: {
        intendedOwnerPhone: String(form.get('intendedOwnerPhone') ?? ''),
        reason: String(form.get('reason') ?? ''),
        liveConfirmation: liveConfirmationFromForm(form, isLiveData),
      },
    })
  }

  function generateLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setCopied(false)
    handoffMutation.mutate({
      path: { id: salonId },
      body: {
        enablePublicPage: form.get('enablePublicPage') === 'on',
        reason: String(form.get('reason') ?? ''),
        liveConfirmation: liveConfirmationFromForm(form, isLiveData),
      },
    })
  }

  async function copyLink() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
  }

  return (
    <Panel title="تحویل سالن به مالک">
      <div className="grid gap-7 lg:grid-cols-2">
        <form className="flex flex-col gap-4" onSubmit={savePhone}>
          <div>
            <h3 className="font-medium">شماره مالک موردنظر</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              تغییر شماره، هر لینک تحویل قبلی را فوراً باطل می‌کند.
            </p>
          </div>
          <LiveDataWarning
            show={isLiveData}
            message="شماره مالک روی داده زنده تغییر می‌کند. برای ادامه LIVE را وارد کنید."
          />
          <FormField
            label="شماره موبایل"
            name="intendedOwnerPhone"
            type="tel"
            defaultValue={intendedOwnerPhone}
            required
          />
          <TextAreaField
            label="دلیل اصلاح شماره"
            name="reason"
            rows={2}
            required
          />
          <LiveConfirmationInput show={isLiveData} />
          <MutationError error={phoneMutation.error} />
          <Button type="submit" disabled={phoneMutation.isPending}>
            <Save data-icon="inline-start" />
            ذخیره شماره
          </Button>
        </form>

        <form className="flex flex-col gap-4" onSubmit={generateLink}>
          <div>
            <h3 className="font-medium">لینک یک‌بارمصرف تحویل</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              لینک ۲۴ ساعت اعتبار دارد و فقط با تایید همین شماره قابل استفاده
              است.
            </p>
          </div>
          <LiveDataWarning
            show={isLiveData}
            message="ساخت لینک روی داده زنده ثبت می‌شود. برای ادامه LIVE را وارد کنید."
          />
          <TextAreaField
            label="دلیل ساخت لینک"
            name="reason"
            rows={2}
            required
          />
          <CheckboxField
            name="enablePublicPage"
            label="فعال‌کردن صفحه عمومی پس از تحویل موفق"
          />
          <p className="-mt-2 text-xs leading-5 text-muted-foreground">
            به‌صورت پیش‌فرض خاموش است و تا پیش از تکمیل تحویل منتشر نمی‌شود.
          </p>
          <LiveConfirmationInput show={isLiveData} />
          <MutationError error={handoffMutation.error} />
          <Button type="submit" disabled={handoffMutation.isPending}>
            <Link2 data-icon="inline-start" />
            ساخت و کپی لینک
          </Button>
          {link ? (
            <div className="flex gap-2">
              <Input value={link} readOnly dir="ltr" aria-label="لینک تحویل" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyLink}
                aria-label="کپی لینک"
              >
                {copied ? <Check /> : <Copy />}
              </Button>
            </div>
          ) : null}
          {copied ? (
            <p className="text-sm text-emerald-700">لینک کپی شد.</p>
          ) : null}
        </form>
      </div>
    </Panel>
  )
}
