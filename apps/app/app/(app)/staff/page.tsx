'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { ArrowRight, Plus, Search, Phone, Shield, User as UserIcon, ListChecks, Clock3 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Avatar, AvatarFallback } from '@repo/ui/avatar'
import { Badge } from '@repo/ui/badge'
import { StaffDrawer } from '@/components/staff/staff-drawer'
import { StaffServicesDrawer } from '@/components/staff/staff-services-drawer'
import { StaffScheduleDrawer } from '@/components/staff/staff-schedule-drawer'
import { useAuth } from '@/components/auth-provider'
import { StaffSkeleton } from '@/components/skeletons/staff-skeleton'
import { User } from '@repo/salon-core/types'
import { cn } from '@repo/ui/utils'
import { displayPhone } from '@repo/salon-core/phone'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json())

export default function StaffPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [showDrawer, setShowDrawer] = useState(false)
  const [servicesStaff, setServicesStaff] = useState<User | null>(null)
  const [scheduleStaff, setScheduleStaff] = useState<User | null>(null)

  useEffect(() => {
    if (user && user.role !== 'manager') {
      router.replace('/calendar')
    }
  }, [user, router])

  const { data, isLoading: staffLoading, mutate } = useSWR(user?.role === 'manager' ? '/api/staff' : null, fetcher)
  const { data: servicesData } = useSWR(user?.role === 'manager' ? '/api/services' : null, fetcher)
  const staff: User[] = data?.staff || []
  const servicesList = servicesData?.services || []

  const filteredStaff = staff.filter(
    (member) =>
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.phone.includes(search)
  )

  const handleAddStaff = () => {
    setShowDrawer(true)
  }

  const handleSuccess = () => {
    setShowDrawer(false)
    mutate()
  }

  const handleServicesSuccess = () => {
    setServicesStaff(null)
    mutate()
  }

  const handleScheduleSuccess = () => {
    setScheduleStaff(null)
    mutate()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
  }

  const getStaffColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      'bg-staff-1': 'bg-staff-1',
      'bg-staff-2': 'bg-staff-2',
      'bg-staff-3': 'bg-staff-3',
      'bg-staff-4': 'bg-staff-4',
      'bg-staff-5': 'bg-staff-5',
    }
    return colorMap[color] || 'bg-primary'
  }

  if (staffLoading) {
    return <StaffSkeleton />
  }

  if (!user || user.role !== 'manager') return null

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center justify-between gap-3 bg-card px-3 py-3 border-b border-border/50">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            asChild
            className="h-10 w-10 shrink-0 rounded-2xl touch-manipulation"
          >
            <Link href="/settings" aria-label="بازگشت به بیشتر">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">پرسنل</h1>
            <p className="truncate text-xs text-muted-foreground">نقش‌ها، خدمات و ساعت کاری</p>
          </div>
        </div>
        <Button size="sm" onClick={handleAddStaff} className="gap-1.5 touch-manipulation">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">پرسنل جدید</span>
        </Button>
      </header>

      <div className="bg-card px-4 pb-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="جستجوی پرسنل…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 h-10 bg-muted/50 border-0"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">پرسنلی یافت نشد</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredStaff.map((member) => (
              <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={cn('text-foreground text-sm font-medium', getStaffColorClass(member.color))}>
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{member.name}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {member.role === 'manager' ? (
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          مدیر
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          پرسنل
                        </span>
                      )}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5" dir="ltr">
                    <Phone className="h-3 w-3" />
                    {displayPhone(member.phone)}
                  </p>
                </div>

                {member.role === 'staff' && (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="touch-manipulation gap-1"
                      aria-label={`تنظیم ساعت کاری ${member.name}`}
                      onClick={() => setScheduleStaff(member)}
                    >
                      <Clock3 className="h-4 w-4" />
                      <span className="hidden sm:inline">ساعت</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="touch-manipulation gap-1"
                      aria-label={`تنظیم خدمات ${member.name}`}
                      onClick={() => setServicesStaff(member)}
                    >
                      <ListChecks className="h-4 w-4" />
                      <span className="hidden sm:inline">خدمات</span>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <StaffDrawer
        open={showDrawer}
        onOpenChange={setShowDrawer}
        onSuccess={handleSuccess}
      />

      <StaffServicesDrawer
        open={!!servicesStaff}
        onOpenChange={(o) => !o && setServicesStaff(null)}
        staff={servicesStaff}
        services={servicesList}
        onSuccess={handleServicesSuccess}
      />

      <StaffScheduleDrawer
        open={!!scheduleStaff}
        onOpenChange={(o) => !o && setScheduleStaff(null)}
        staff={scheduleStaff}
        onSuccess={handleScheduleSuccess}
      />
    </div>
  )
}
