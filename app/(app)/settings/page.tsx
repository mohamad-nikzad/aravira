'use client'

import { useState } from 'react'
import { LogOut, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/components/auth-provider'
import { Spinner } from '@/components/ui/spinner'

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
  }

  const toggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled)
    if (enabled) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
  }

  if (authLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 border-b bg-card px-4 py-3">
        <h1 className="text-lg font-semibold">تنظیمات</h1>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Profile section */}
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground" dir="ltr">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user.role === 'manager' ? 'مدیر' : 'پرسنل'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ظاهر
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-sm">حالت تاریک</span>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              حساب کاربری
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <Spinner className="ml-2 h-4 w-4" />
              ) : (
                <LogOut className="ml-2 h-4 w-4" />
              )}
              {loggingOut ? 'در حال خروج...' : 'خروج از حساب'}
            </Button>
          </CardContent>
        </Card>

        {/* App info */}
        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">سالن زیبایی بلوم</p>
          <p className="text-xs text-muted-foreground">نسخه ۱.۰.۰</p>
        </div>
      </div>
    </div>
  )
}
