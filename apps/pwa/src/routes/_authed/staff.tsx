import { useState, useEffect } from 'react'
import {
  createFileRoute,
  redirect,
  useNavigate,
  Link,
} from '@tanstack/react-router'
import {
  ArrowRight,
  Plus,
  Search,
  Phone,
  Shield,
  User as UserIcon,
  ListChecks,
  Clock3,
  KeyRound,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@repo/ui/avatar'
import { Badge } from '@repo/ui/badge'
import { StaffDrawer } from '#/components/staff/staff-drawer'
import { StaffPasswordDrawer } from '#/components/staff/staff-password-drawer'
import { StaffServicesDrawer } from '#/components/staff/staff-services-drawer'
import { StaffScheduleDrawer } from '#/components/staff/staff-schedule-drawer'
import { useAuth } from '#/lib/auth'
import { useManagerDataClient } from '#/lib/manager-data-client'
import {
  useManagerServicesQuery,
  useManagerStaffQuery,
} from '#/lib/manager-data-queries'
import { StaffSkeleton } from '#/components/staff/staff-skeleton'
import type { User } from '@repo/salon-core/types'
import { normalizeCalendarColorId } from '@repo/salon-core/calendar-colors'
import { displayPhone } from '@repo/salon-core/phone'
import { api } from '#/lib/api-client'
import { useManagerWriteMutation } from '#/lib/use-manager-mutation'

export const Route = createFileRoute('/_authed/staff')({
  beforeLoad: ({ context }) => {
    if (context.user.role !== 'manager') {
      throw redirect({ to: '/today' })
    }
  },
  component: StaffPage,
})

function StaffPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const dc = useManagerDataClient()
  const [search, setSearch] = useState('')
  const [showDrawer, setShowDrawer] = useState(false)
  const [editingStaff, setEditingStaff] = useState<User | null>(null)
  const [passwordStaff, setPasswordStaff] = useState<User | null>(null)
  const [servicesStaff, setServicesStaff] = useState<User | null>(null)
  const [scheduleStaff, setScheduleStaff] = useState<User | null>(null)
  const [deletingStaff, setDeletingStaff] = useState<User | null>(null)

  const isManager = user?.role === 'manager'
  const staffQuery = useManagerStaffQuery(!!dc && isManager)
  const servicesQuery = useManagerServicesQuery(!!dc && isManager)
  const staff = staffQuery.data ?? []
  const servicesList = servicesQuery.data ?? []

  useEffect(() => {
    if (user && user.role !== 'manager') {
      navigate({ to: '/today', replace: true })
    }
  }, [user, navigate])

  const filteredStaff = staff.filter((member) => {
    const query = search.toLowerCase()
    return (
      member.name.toLowerCase().includes(query) ||
      (member.fullName ?? '').toLowerCase().includes(query) ||
      member.phone.includes(search)
    )
  })

  const handleAddStaff = () => {
    setEditingStaff(null)
    setShowDrawer(true)
  }

  const handleSuccess = () => {
    setShowDrawer(false)
    setEditingStaff(null)
    void dc?.staff.refresh()
  }

  const handleServicesSuccess = () => {
    setServicesStaff(null)
    void dc?.staff.refresh()
  }

  const handlePasswordSuccess = () => {
    setPasswordStaff(null)
  }

  const handleScheduleSuccess = () => {
    setScheduleStaff(null)
    void dc?.staff.refresh()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
  }

  const staffLoading =
    isManager && !!dc && (staffQuery.isPending || servicesQuery.isPending)

  const deleteStaff = useManagerWriteMutation('staff.delete', {
    apiFn: async (member: User) => {
      await api.staff.delete(member.id)
    },
    meta: { errorMessage: 'حذف پرسنل انجام نشد' },
    onSuccess: () => {
      setDeletingStaff(null)
      void dc?.staff.refresh()
    },
  })

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
            <Link to="/settings" aria-label="بازگشت به بیشتر">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">پرسنل</h1>
            <p className="truncate text-xs text-muted-foreground">
              نقش‌ها، خدمات و ساعت کاری
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleAddStaff}
          className="gap-1.5 touch-manipulation"
        >
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
              <div
                key={member.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback
                    className="text-foreground text-sm font-medium"
                    style={{
                      backgroundColor: `var(--calendar-${normalizeCalendarColorId(member.color)})`,
                    }}
                  >
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">
                      {member.name}
                    </p>
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
                  <p
                    className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"
                    dir="ltr"
                  >
                    <Phone className="h-3 w-3" />
                    {displayPhone(member.phone)}
                  </p>
                  {member.fullName && member.fullName !== member.name ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {member.fullName}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="touch-manipulation gap-1"
                    aria-label={`ویرایش ${member.name}`}
                    onClick={() => {
                      setEditingStaff(member)
                      setShowDrawer(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="hidden sm:inline">ویرایش</span>
                  </Button>
                  {member.id !== user.id ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="touch-manipulation gap-1"
                        aria-label={`تغییر رمز عبور ${member.name}`}
                        onClick={() => setPasswordStaff(member)}
                      >
                        <KeyRound className="h-4 w-4" />
                        <span className="hidden sm:inline">رمز</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="touch-manipulation gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`حذف ${member.name}`}
                        onClick={() => setDeletingStaff(member)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">حذف</span>
                      </Button>
                    </>
                  ) : null}
                  {member.role === 'staff' ? (
                    <>
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
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <StaffDrawer
        open={showDrawer}
        onOpenChange={(open) => {
          setShowDrawer(open)
          if (!open) setEditingStaff(null)
        }}
        onSuccess={handleSuccess}
        staff={editingStaff}
      />

      <StaffServicesDrawer
        open={!!servicesStaff}
        onOpenChange={(o) => !o && setServicesStaff(null)}
        staff={servicesStaff}
        services={servicesList}
        onSuccess={handleServicesSuccess}
      />

      <StaffPasswordDrawer
        open={!!passwordStaff}
        onOpenChange={(o) => !o && setPasswordStaff(null)}
        staff={passwordStaff}
        onSuccess={handlePasswordSuccess}
      />

      <StaffScheduleDrawer
        open={!!scheduleStaff}
        onOpenChange={(o) => !o && setScheduleStaff(null)}
        staff={scheduleStaff}
        onSuccess={handleScheduleSuccess}
      />

      <AlertDialog
        open={!!deletingStaff}
        onOpenChange={(open) => {
          if (!open && !deleteStaff.isPending) setDeletingStaff(null)
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className="text-start">
            <AlertDialogTitle>حذف پرسنل؟</AlertDialogTitle>
            <AlertDialogDescription className="text-start">
              {deletingStaff
                ? `${deletingStaff.name} از فهرست پرسنل و دسترسی سالن حذف می‌شود، اما سوابق نوبت‌ها باقی می‌ماند.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteStaff.isPending}>
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!deletingStaff || deleteStaff.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault()
                if (deletingStaff) deleteStaff.mutate(deletingStaff)
              }}
            >
              {deleteStaff.isPending ? 'در حال حذف…' : 'حذف پرسنل'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
