import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@repo/ui/button'

import { useAuth } from '#/lib/auth'

export const Route = createFileRoute('/_authed/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    await navigate({ to: '/login' })
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <h1 className="text-xl font-bold">تنظیمات</h1>
      {user ? (
        <div className="rounded-xl border border-border/60 bg-card p-4 text-sm">
          <p className="font-medium">{user.name}</p>
          <p className="mt-1 text-muted-foreground">نقش: {user.role}</p>
        </div>
      ) : null}
      <Button onClick={handleLogout} variant="outline" className="h-12 rounded-xl">
        خروج از حساب
      </Button>
      <p className="text-xs text-muted-foreground">
        تنظیمات کامل به‌زودی در نسخه جدید…
      </p>
    </div>
  )
}
