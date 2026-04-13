'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Users, UserCircle, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/calendar', label: 'تقویم', icon: Calendar },
  { href: '/clients', label: 'مشتریان', icon: Users },
  { href: '/staff', label: 'پرسنل', icon: UserCircle },
  { href: '/settings', label: 'تنظیمات', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card safe-area-pb">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
