'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Plus, Search, Phone, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ClientDrawer } from '@/components/clients/client-drawer'
import { useAuth } from '@/components/auth-provider'
import { Spinner } from '@/components/ui/spinner'
import { Client } from '@/lib/types'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json())

export default function ClientsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [search, setSearch] = useState('')
  const [showDrawer, setShowDrawer] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  useEffect(() => {
    if (!authLoading && user && user.role !== 'manager') {
      router.replace('/calendar')
    }
  }, [authLoading, user, router])

  const { data, mutate } = useSWR(user?.role === 'manager' ? '/api/clients' : null, fetcher)
  const clients: Client[] = data?.clients || []

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.phone.includes(search)
  )

  const handleAddClient = () => {
    setSelectedClient(null)
    setShowDrawer(true)
  }

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setShowDrawer(true)
  }

  const handleSuccess = () => {
    setShowDrawer(false)
    setSelectedClient(null)
    mutate()
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
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user || user.role !== 'manager') return null

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center justify-between gap-4 bg-card px-4 py-3 border-b border-border/50">
        <h1 className="text-lg font-bold">مشتریان</h1>
        <Button size="sm" onClick={handleAddClient} className="gap-1.5 touch-manipulation">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">مشتری جدید</span>
        </Button>
      </header>

      <div className="bg-card px-4 pb-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="جستجوی مشتری..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 h-10 bg-muted/50 border-0"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">مشتری‌ای یافت نشد</p>
            <Button variant="link" onClick={handleAddClient} className="text-primary">
              اولین مشتری را اضافه کنید
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-muted/50"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/8 text-primary text-sm font-medium">
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{client.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5" dir="ltr">
                    <Phone className="h-3 w-3" />
                    {client.phone}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="touch-manipulation shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handleEditClient(client)}>
                      ویرایش
                    </DropdownMenuItem>
                    {client.phone && (
                      <DropdownMenuItem asChild>
                        <a href={`tel:${client.phone}`}>تماس</a>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      <ClientDrawer
        open={showDrawer}
        onOpenChange={setShowDrawer}
        client={selectedClient}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
