'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Search, Mail, Phone, Shield, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { StaffDrawer } from '@/components/staff/staff-drawer'
import { useAuth } from '@/components/auth-provider'
import { Spinner } from '@/components/ui/spinner'
import { User } from '@/lib/types'
import { cn } from '@/lib/utils'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json())

export default function StaffPage() {
  const { user, loading: authLoading } = useAuth()
  const [search, setSearch] = useState('')
  const [showDrawer, setShowDrawer] = useState(false)

  const { data, mutate } = useSWR(user ? '/api/staff' : null, fetcher)
  const staff: User[] = data?.staff || []

  const filteredStaff = staff.filter(
    (member) =>
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase())
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

  if (authLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user) return null

  const isManager = user.role === 'manager'

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 border-b bg-card px-4 py-3">
        <h1 className="text-lg font-semibold">پرسنل</h1>
        {isManager && (
          <Button size="sm" onClick={handleAddStaff}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline mr-1.5">پرسنل جدید</span>
          </Button>
        )}
      </header>

      {/* Search */}
      <div className="border-b bg-card px-4 py-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="جستجوی پرسنل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* Staff list */}
      <div className="flex-1 overflow-auto p-4">
        {filteredStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">پرسنلی یافت نشد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredStaff.map((member) => (
              <Card key={member.id} className="py-3">
                <CardContent className="flex items-center gap-3 px-4 py-0">
                  <Avatar>
                    <AvatarFallback className={cn('text-foreground', getStaffColorClass(member.color))}>
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{member.name}</p>
                      <Badge variant="secondary" className="text-xs">
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
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 truncate" dir="ltr">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </span>
                      {member.phone && (
                        <span className="hidden sm:flex items-center gap-1" dir="ltr">
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {isManager && (
        <StaffDrawer
          open={showDrawer}
          onOpenChange={setShowDrawer}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
