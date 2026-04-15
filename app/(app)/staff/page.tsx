'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Plus, Search, Phone, Shield, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { StaffDrawer } from '@/components/staff/staff-drawer'
import { useAuth } from '@/components/auth-provider'
import { StaffSkeleton } from '@/components/skeletons/staff-skeleton'
import { User } from '@/lib/types'
import { cn } from '@/lib/utils'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json())

export default function StaffPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [showDrawer, setShowDrawer] = useState(false)

  useEffect(() => {
    if (user && user.role !== 'manager') {
      router.replace('/calendar')
    }
  }, [user, router])

  const { data, isLoading: staffLoading, mutate } = useSWR(user?.role === 'manager' ? '/api/staff' : null, fetcher)
  const staff: User[] = data?.staff || []

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
      <header className="flex items-center justify-between gap-4 bg-card px-4 py-3 border-b border-border/50">
        <h1 className="text-lg font-bold">پرسنل</h1>
        <Button size="sm" onClick={handleAddStaff} className="gap-1.5 touch-manipulation">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">پرسنل جدید</span>
        </Button>
      </header>

      <div className="bg-card px-4 pb-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="جستجوی پرسنل..."
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
                    {member.phone}
                  </p>
                </div>
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
    </div>
  )
}
