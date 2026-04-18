'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarPlus,
  Check,
  Clock3,
  ListChecks,
  LockKeyhole,
  MapPin,
  RotateCcw,
  Scissors,
  Store,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { SERVICE_CATEGORIES, STAFF_COLORS, type Service } from '@/lib/types'

type OnboardingStepKey =
  | 'profileConfirmed'
  | 'businessHoursSet'
  | 'servicesAdded'
  | 'staffAdded'
  | 'firstAppointmentCreated'

type OnboardingStatus = {
  salon: {
    id: string
    name: string
    slug: string
    phone: string | null
    address: string | null
  } | null
  steps: Record<OnboardingStepKey, boolean>
  completedAt: string | null
  skippedAt: string | null
}

type BusinessSettings = {
  workingStart: string
  workingEnd: string
  slotDurationMinutes: number
}

type OnboardingAction = 'confirm-profile' | 'complete' | 'reopen'

const onboardingSteps: Array<{
  key: OnboardingStepKey
  title: string
  description: string
  icon: React.ElementType
  required: boolean
}> = [
  {
    key: 'profileConfirmed',
    title: 'پروفایل سالن',
    description: 'اطلاعات اصلی فضای کاری را تایید کنید.',
    icon: Store,
    required: false,
  },
  {
    key: 'businessHoursSet',
    title: 'ساعات کاری',
    description: 'ساعت شروع، پایان و بازه نوبت‌ها را مشخص کنید.',
    icon: Clock3,
    required: false,
  },
  {
    key: 'servicesAdded',
    title: 'اولین خدمت',
    description: 'حداقل یک خدمت برای رزرو و تقویم لازم است.',
    icon: Scissors,
    required: true,
  },
  {
    key: 'staffAdded',
    title: 'اولین پرسنل',
    description: 'حداقل یک پرسنل برای اختصاص نوبت لازم است.',
    icon: Users,
    required: true,
  },
  {
    key: 'firstAppointmentCreated',
    title: 'اولین نوبت',
    description: 'بعد از آماده‌سازی، یک نوبت آزمایشی بسازید.',
    icon: CalendarPlus,
    required: false,
  },
]

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) throw new Error('Request failed')
  return response.json()
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('fa-IR').format(value)
}

function firstIncompleteStep(onboarding: OnboardingStatus): OnboardingStepKey {
  return onboardingSteps.find((step) => !onboarding.steps[step.key])?.key ?? 'firstAppointmentCreated'
}

function OnboardingSkeleton() {
  return (
    <div className="flex h-full flex-col bg-background">
      <header className="border-b border-border/50 bg-card px-4 py-4">
        <Skeleton className="h-6 w-32" />
      </header>
      <div className="flex-1 space-y-4 overflow-auto p-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    </div>
  )
}

function StepNavigation({
  onboarding,
  activeStep,
  onSelect,
}: {
  onboarding: OnboardingStatus
  activeStep: OnboardingStepKey
  onSelect: (step: OnboardingStepKey) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
      {onboardingSteps.map((step) => {
        const Icon = step.icon
        const isDone = onboarding.steps[step.key]
        const isActive = activeStep === step.key

        return (
          <button
            key={step.key}
            type="button"
            onClick={() => onSelect(step.key)}
            className={cn(
              'flex min-h-16 items-center gap-3 rounded-2xl border p-3 text-right transition-colors sm:flex-col sm:items-start',
              isActive
                ? 'border-primary bg-primary/8 text-foreground shadow-sm'
                : 'border-border/60 bg-card text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                isDone ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground',
                isActive && !isDone && 'bg-primary/10 text-primary',
              )}
            >
              {isDone ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                {step.title}
                {step.required && !isDone && (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">
                    ضروری
                  </span>
                )}
              </span>
              <span className="mt-1 block text-xs leading-5">{step.description}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function ProfileStep({
  onboarding,
  pending,
  onConfirm,
}: {
  onboarding: OnboardingStatus
  pending: boolean
  onConfirm: () => void
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="space-y-1 text-right">
        <CardTitle className="flex items-center gap-2 text-base">
          <Store className="h-5 w-5 text-primary" />
          تایید پروفایل سالن
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          این اطلاعات برای نمایش فضای کاری و لینک عمومی آینده سالن استفاده می‌شود.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">نام سالن</p>
            <p className="mt-1 font-bold">{onboarding.salon?.name ?? 'ثبت نشده'}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">آدرس کوتاه</p>
            <p className="mt-1 text-left font-bold" dir="ltr">
              /{onboarding.salon?.slug ?? 'salon'}
            </p>
          </div>
        </div>

        {onboarding.salon?.address && (
          <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {onboarding.salon.address}
          </div>
        )}

        <Button
          className="w-full"
          disabled={pending || onboarding.steps.profileConfirmed}
          onClick={onConfirm}
        >
          {pending && <Spinner className="ml-2" />}
          {onboarding.steps.profileConfirmed ? 'پروفایل تایید شده' : 'تایید پروفایل'}
        </Button>
      </CardContent>
    </Card>
  )
}

function BusinessHoursStep({
  settings,
  onSaved,
}: {
  settings?: BusinessSettings
  onSaved: () => void
}) {
  const [workingStart, setWorkingStart] = useState('09:00')
  const [workingEnd, setWorkingEnd] = useState('19:00')
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(30)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!settings) return
    setWorkingStart(settings.workingStart)
    setWorkingEnd(settings.workingEnd)
    setSlotDurationMinutes(settings.slotDurationMinutes)
  }, [settings])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/settings/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ workingStart, workingEnd, slotDurationMinutes }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'ذخیره ساعات کاری انجام نشد')
        return
      }
      onSaved()
    } catch {
      setError('خطایی رخ داد. دوباره تلاش کنید.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="space-y-1 text-right">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock3 className="h-5 w-5 text-primary" />
          ساعات کاری سالن
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          تقویم و پیشنهاد زمان نوبت‌ها بر اساس این بازه ساخته می‌شود.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="onboarding-working-start">شروع</FieldLabel>
                <Input
                  id="onboarding-working-start"
                  type="time"
                  value={workingStart}
                  onChange={(event) => setWorkingStart(event.target.value)}
                  dir="ltr"
                  className="h-11 text-left"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="onboarding-working-end">پایان</FieldLabel>
                <Input
                  id="onboarding-working-end"
                  type="time"
                  value={workingEnd}
                  onChange={(event) => setWorkingEnd(event.target.value)}
                  dir="ltr"
                  className="h-11 text-left"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="onboarding-slot-duration">فاصله اسلات‌ها</FieldLabel>
              <Input
                id="onboarding-slot-duration"
                type="number"
                min={5}
                step={5}
                value={slotDurationMinutes}
                onChange={(event) => setSlotDurationMinutes(Number(event.target.value))}
                dir="ltr"
                className="h-11 text-left"
              />
              <FieldDescription>عدد به دقیقه است؛ مقدار رایج برای سالن‌ها ۳۰ دقیقه است.</FieldDescription>
            </Field>
            {error && <FieldError>{error}</FieldError>}
            <Button className="w-full" disabled={saving}>
              {saving && <Spinner className="ml-2" />}
              ذخیره ساعات کاری
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

function ServiceStep({
  isDone,
  onCreated,
}: {
  isDone: boolean
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Service['category']>('hair')
  const [duration, setDuration] = useState(45)
  const [price, setPrice] = useState(0)
  const [color, setColor] = useState<string>(STAFF_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          category,
          duration,
          price,
          color,
          active: true,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'افزودن خدمت انجام نشد')
        return
      }
      setName('')
      setDuration(45)
      setPrice(0)
      onCreated()
    } catch {
      setError('خطایی رخ داد. دوباره تلاش کنید.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="space-y-1 text-right">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scissors className="h-5 w-5 text-primary" />
            تعریف اولین خدمت
          </CardTitle>
          {isDone && <Badge variant="secondary">حداقل خدمت ثبت شده</Badge>}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          بدون خدمت، تقویم نمی‌تواند مدت زمان و قیمت نوبت را محاسبه کند.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="onboarding-service-name">نام خدمت</FieldLabel>
              <Input
                id="onboarding-service-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="مثلاً کوتاهی مو"
                className="h-11 text-right"
                required
              />
            </Field>
            <Field>
              <FieldLabel>دسته خدمت</FieldLabel>
              <Select value={category} onValueChange={(value) => setCategory(value as Service['category'])}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SERVICE_CATEGORIES) as Service['category'][]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {SERVICE_CATEGORIES[key].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="onboarding-service-duration">مدت</FieldLabel>
                <Input
                  id="onboarding-service-duration"
                  type="number"
                  min={5}
                  step={5}
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                  dir="ltr"
                  className="h-11 text-left"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="onboarding-service-price">قیمت</FieldLabel>
                <Input
                  id="onboarding-service-price"
                  type="number"
                  min={0}
                  value={price}
                  onChange={(event) => setPrice(Number(event.target.value))}
                  dir="ltr"
                  className="h-11 text-left"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel>رنگ در تقویم</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {STAFF_COLORS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-label={item}
                    onClick={() => setColor(item)}
                    className={cn(
                      'h-9 w-9 rounded-xl border-2',
                      item,
                      color === item ? 'border-foreground' : 'border-transparent',
                    )}
                  />
                ))}
              </div>
            </Field>
            {error && <FieldError>{error}</FieldError>}
            <Button className="w-full" disabled={saving || !name.trim()}>
              {saving && <Spinner className="ml-2" />}
              {isDone ? 'افزودن خدمت دیگر' : 'ثبت اولین خدمت'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

function StaffStep({
  isDone,
  onCreated,
}: {
  isDone: boolean
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          phone,
          password,
          role: 'staff',
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'افزودن پرسنل انجام نشد')
        return
      }
      setName('')
      setPhone('')
      setPassword('')
      onCreated()
    } catch {
      setError('خطایی رخ داد. دوباره تلاش کنید.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="space-y-1 text-right">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            افزودن اولین پرسنل
          </CardTitle>
          {isDone && <Badge variant="secondary">حداقل پرسنل ثبت شده</Badge>}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          هر نوبت باید به یک عضو تیم اختصاص داده شود. بعداً می‌توانید خدمات هر پرسنل را دقیق‌تر تنظیم کنید.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="onboarding-staff-name">نام و نام خانوادگی</FieldLabel>
              <Input
                id="onboarding-staff-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="مثلاً نرگس کاظمی"
                className="h-11 text-right"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="onboarding-staff-phone">شماره موبایل</FieldLabel>
              <Input
                id="onboarding-staff-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="09120000000"
                inputMode="numeric"
                dir="ltr"
                className="h-11 text-left"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="onboarding-staff-password">رمز عبور پرسنل</FieldLabel>
              <Input
                id="onboarding-staff-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="حداقل یک رمز موقت"
                className="h-11"
                required
              />
              <FieldDescription>پرسنل با همین شماره و رمز وارد پنل خود می‌شود.</FieldDescription>
            </Field>
            {error && <FieldError>{error}</FieldError>}
            <Button className="w-full" disabled={saving || !name.trim() || !phone.trim() || !password}>
              {saving && <Spinner className="ml-2" />}
              {isDone ? 'افزودن پرسنل دیگر' : 'ثبت اولین پرسنل'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

function FirstAppointmentStep({
  requiredDone,
  pending,
  onContinue,
}: {
  requiredDone: boolean
  pending: boolean
  onContinue: () => void
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="space-y-1 text-right">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarPlus className="h-5 w-5 text-primary" />
          آماده ثبت اولین نوبت
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          بعد از ساخت خدمت و پرسنل، وارد تقویم شوید و اولین نوبت سالن را ثبت کنید.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!requiredDone && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm leading-6 text-destructive">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
            تا وقتی حداقل یک خدمت و یک پرسنل ثبت نشده باشد، دسترسی به تقویم و بقیه برنامه بسته می‌ماند.
          </div>
        )}
        <Button className="w-full gap-2" disabled={!requiredDone || pending} onClick={onContinue}>
          {pending && <Spinner className="ml-2" />}
          ورود به تقویم و ثبت نوبت
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState<OnboardingStepKey | null>(null)
  const [pendingAction, setPendingAction] = useState<OnboardingAction | null>(null)
  const {
    data,
    isLoading,
    mutate: mutateOnboarding,
  } = useSWR<{ onboarding: OnboardingStatus }>('/api/onboarding', fetcher)
  const { data: settingsData, mutate: mutateSettings } = useSWR<{ settings: BusinessSettings }>(
    '/api/settings/business',
    fetcher,
  )

  const onboarding = data?.onboarding

  useEffect(() => {
    if (!onboarding) return
    const nextStep = firstIncompleteStep(onboarding)
    setActiveStep((current) => {
      if (!current || onboarding.steps[current]) return nextStep
      return current
    })
  }, [onboarding])

  async function updateOnboarding(action: OnboardingAction, redirectTo?: string) {
    setPendingAction(action)
    try {
      const response = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        await mutateOnboarding()
        if (redirectTo) {
          router.push(redirectTo)
          router.refresh()
        }
      }
    } finally {
      setPendingAction(null)
    }
  }

  async function refreshAfterRequiredStep(nextStep: OnboardingStepKey) {
    await mutateOnboarding()
    setActiveStep(nextStep)
  }

  if (isLoading || !onboarding || !activeStep) {
    return <OnboardingSkeleton />
  }

  const doneCount = onboardingSteps.filter((step) => onboarding.steps[step.key]).length
  const requiredDone = onboarding.steps.servicesAdded && onboarding.steps.staffAdded
  const appLocked = !requiredDone
  const progressPercent = Math.round((doneCount / onboardingSteps.length) * 100)
  const setupClosed = (!!onboarding.completedAt || !!onboarding.skippedAt) && requiredDone

  return (
    <div className="flex h-full flex-col bg-background" dir="rtl">
      <header className="border-b border-border/50 bg-card px-4 py-4">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <ListChecks className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black tracking-tight">راه‌اندازی سالن</h1>
              <p className="truncate text-xs text-muted-foreground">
                {onboarding.salon?.name ?? 'سالن شما'} را برای اولین نوبت آماده کنید
              </p>
            </div>
          </div>
          {setupClosed && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1"
              disabled={pendingAction === 'reopen'}
              onClick={() => updateOnboarding('reopen')}
            >
              <RotateCcw className="h-4 w-4" />
              بازکردن
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-5xl space-y-4 p-4 pb-6">
          <Card className="overflow-hidden border-border/50 bg-card">
            <CardContent className="space-y-5 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                    <BriefcaseBusiness className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">فضای کاری</p>
                    <h2 className="truncate text-2xl font-black tracking-tight">
                      {onboarding.salon?.name ?? 'سالن شما'}
                    </h2>
                    {onboarding.salon?.slug && (
                      <p className="mt-1 text-left text-xs text-muted-foreground" dir="ltr">
                        /{onboarding.salon.slug}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={appLocked ? 'destructive' : 'secondary'} className="w-fit">
                  {appLocked ? 'دسترسی برنامه بسته است' : 'آماده استفاده'}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">پیشرفت راه‌اندازی</span>
                  <span className="text-muted-foreground">
                    {formatNumber(doneCount)} از {formatNumber(onboardingSteps.length)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {appLocked ? (
                <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  برای ورود به تقویم، مشتریان، داشبورد و تنظیمات اصلی، ابتدا یک خدمت و یک پرسنل ثبت کنید.
                </div>
              ) : (
                <Button
                  className="w-full gap-2"
                  disabled={pendingAction === 'complete'}
                  onClick={() => updateOnboarding('complete', '/calendar')}
                >
                  {pendingAction === 'complete' && <Spinner className="ml-2" />}
                  ورود به برنامه
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>

          <StepNavigation
            onboarding={onboarding}
            activeStep={activeStep}
            onSelect={setActiveStep}
          />

          {activeStep === 'profileConfirmed' && (
            <ProfileStep
              onboarding={onboarding}
              pending={pendingAction === 'confirm-profile'}
              onConfirm={() => updateOnboarding('confirm-profile')}
            />
          )}

          {activeStep === 'businessHoursSet' && (
            <BusinessHoursStep
              settings={settingsData?.settings}
              onSaved={async () => {
                await mutateSettings()
                await mutateOnboarding()
              }}
            />
          )}

          {activeStep === 'servicesAdded' && (
            <ServiceStep
              isDone={onboarding.steps.servicesAdded}
              onCreated={() => refreshAfterRequiredStep('staffAdded')}
            />
          )}

          {activeStep === 'staffAdded' && (
            <StaffStep
              isDone={onboarding.steps.staffAdded}
              onCreated={() => refreshAfterRequiredStep('firstAppointmentCreated')}
            />
          )}

          {activeStep === 'firstAppointmentCreated' && (
            <FirstAppointmentStep
              requiredDone={requiredDone}
              pending={pendingAction === 'complete'}
              onContinue={() => updateOnboarding('complete', '/calendar')}
            />
          )}
        </div>
      </main>
    </div>
  )
}
