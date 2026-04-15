'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
  Users,
  UserPlus,
  CalendarDays,
  CalendarCheck,
  CalendarClock,
  TrendingUp,
  Scissors,
  Banknote,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth-provider'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { APPOINTMENT_STATUS } from '@/lib/types'
import Link from 'next/link'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json())

interface DashboardData {
  totalClients: number
  totalStaff: number
  todayAppointments: number
  weekAppointments: number
  monthAppointments: number
  todayStatusBreakdown: { status: string; count: number }[]
  monthStatusBreakdown: { status: string; count: number }[]
  popularServices: { name: string; count: number }[]
  staffLoad: { name: string; color: string; count: number }[]
  monthRevenue: number
  newClientsThisMonth: number
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('fa-IR').format(n)
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('fa-IR').format(n) + ' تومان'
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  className,
}: {
  title: string
  value: string
  icon: React.ElementType
  subtitle?: string
  className?: string
}) {
  return (
    <Card className={`border-border/50 ${className ?? ''}`}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProgressBar({
  value,
  max,
  color,
}: {
  value: number
  max: number
  color: string
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className={`h-2 rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-muted-foreground',
  confirmed: 'bg-primary',
  completed: 'bg-green-500',
  cancelled: 'bg-destructive',
  'no-show': 'bg-orange-500',
}

const BAR_COLORS = [
  'bg-primary',
  'bg-green-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-rose-500',
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { data, isLoading } = useSWR<DashboardData>(
    user?.role === 'manager' ? '/api/dashboard' : null,
    fetcher,
    { refreshInterval: 60_000 }
  )

  useEffect(() => {
    if (!authLoading && user && user.role !== 'manager') {
      router.replace('/calendar')
    }
  }, [authLoading, user, router])

  if (authLoading || isLoading) {
    return <DashboardSkeleton />
  }

  if (!user || user.role !== 'manager') return null
  if (!data) return null

  const maxServiceCount = Math.max(...(data.popularServices.map((s) => s.count)), 1)
  const maxStaffCount = Math.max(...(data.staffLoad.map((s) => s.count)), 1)

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b border-border/50">
        <Button variant="ghost" size="icon-sm" asChild className="touch-manipulation">
          <Link href="/settings">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-bold">داشبورد</h1>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="نوبت‌های امروز"
            value={formatNumber(data.todayAppointments)}
            icon={CalendarCheck}
          />
          <StatCard
            title="نوبت‌های هفته"
            value={formatNumber(data.weekAppointments)}
            icon={CalendarClock}
          />
          <StatCard
            title="نوبت‌های ماه"
            value={formatNumber(data.monthAppointments)}
            icon={CalendarDays}
          />
          <StatCard
            title="درآمد ماه"
            value={formatPrice(data.monthRevenue)}
            icon={Banknote}
            subtitle="نوبت‌های انجام‌شده"
          />
          <StatCard
            title="کل مشتریان"
            value={formatNumber(data.totalClients)}
            icon={Users}
            subtitle={
              data.newClientsThisMonth > 0
                ? `${formatNumber(data.newClientsThisMonth)} مشتری جدید این ماه`
                : undefined
            }
          />
          <StatCard
            title="پرسنل فعال"
            value={formatNumber(data.totalStaff)}
            icon={UserPlus}
          />
        </div>

        {data.todayStatusBreakdown.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                وضعیت نوبت‌های امروز
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {data.todayStatusBreakdown.map((item) => {
                const label =
                  APPOINTMENT_STATUS[item.status as keyof typeof APPOINTMENT_STATUS]
                    ?.label ?? item.status
                const colorCls =
                  APPOINTMENT_STATUS[item.status as keyof typeof APPOINTMENT_STATUS]
                    ?.color ?? ''
                return (
                  <Badge
                    key={item.status}
                    variant="secondary"
                    className={`text-xs gap-1.5 px-2.5 py-1 ${colorCls}`}
                  >
                    <span className="font-bold">{formatNumber(item.count)}</span>
                    {label}
                  </Badge>
                )
              })}
            </CardContent>
          </Card>
        )}

        {data.popularServices.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                پرطرفدارترین خدمات این ماه
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.popularServices.map((svc, i) => (
                <div key={svc.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{svc.name}</span>
                    <span className="text-muted-foreground text-xs mr-2 shrink-0">
                      {formatNumber(svc.count)} نوبت
                    </span>
                  </div>
                  <ProgressBar
                    value={svc.count}
                    max={maxServiceCount}
                    color={BAR_COLORS[i % BAR_COLORS.length]}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {data.staffLoad.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                عملکرد پرسنل این ماه
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.staffLoad.map((staff) => (
                <div key={staff.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{staff.name}</span>
                    <span className="text-muted-foreground text-xs mr-2 shrink-0">
                      {formatNumber(staff.count)} نوبت
                    </span>
                  </div>
                  <ProgressBar
                    value={staff.count}
                    max={maxStaffCount}
                    color="bg-primary"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {data.monthStatusBreakdown.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                وضعیت کلی نوبت‌های ماه
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-3 w-full overflow-hidden rounded-full">
                {data.monthStatusBreakdown.map((item) => {
                  const total = data.monthStatusBreakdown.reduce(
                    (sum, i) => sum + i.count,
                    0
                  )
                  const pct = total > 0 ? (item.count / total) * 100 : 0
                  return (
                    <div
                      key={item.status}
                      className={`${STATUS_COLORS[item.status] ?? 'bg-muted'} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  )
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {data.monthStatusBreakdown.map((item) => {
                  const label =
                    APPOINTMENT_STATUS[item.status as keyof typeof APPOINTMENT_STATUS]
                      ?.label ?? item.status
                  return (
                    <div key={item.status} className="flex items-center gap-1.5 text-xs">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[item.status] ?? 'bg-muted'}`}
                      />
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{formatNumber(item.count)}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
