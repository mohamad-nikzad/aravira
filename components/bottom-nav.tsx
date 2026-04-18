'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Users, Settings, LayoutDashboard, ListChecks } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth-provider'

const managerItems = [
  { href: '/calendar', label: 'تقویم', icon: Calendar },
  { href: '/clients', label: 'مشتریان', icon: Users },
  { href: '/dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { href: '/onboarding', label: 'راه‌اندازی', icon: ListChecks },
  { href: '/settings', label: 'تنظیمات', icon: Settings },
] as const

const staffItems = [
  { href: '/calendar', label: 'تقویم', icon: Calendar },
  { href: '/settings', label: 'تنظیمات', icon: Settings },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const items = user?.role === 'manager' ? managerItems : staffItems

  return (
    <nav className="shrink-0 border-t border-border/60 bg-card safe-area-pb">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium transition-colors touch-manipulation',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-foreground'
              )}
            >
              <div className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg transition-all',
                isActive && 'bg-primary/12'
              )}>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.7} />
              </div>
              <span className="truncate px-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
