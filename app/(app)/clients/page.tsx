'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Search, Phone, Mail, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
  const { user, loading: authLoading } = useAuth()
  const [search, setSearch] = useState('')
  const [showDrawer, setShowDrawer] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const { data, mutate } = useSWR(user ? '/api/clients' : null, fetcher)
  const clients: Client[] = data?.clients || []

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.phone.includes(search) ||
      client.email?.toLowerCase().includes(search.toLowerCase())
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
        <h1 className="text-lg font-semibold">مشتریان</h1>
        <Button size="sm" onClick={handleAddClient}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline mr-1.5">مشتری جدید</span>
        </Button>
      </header>

      {/* Search */}
      <div className="border-b bg-card px-4 py-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="جستجوی مشتری..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      {/* Client list */}
      <div className="flex-1 overflow-auto p-4">
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">مشتری‌ای یافت نشد</p>
            <Button variant="link" onClick={handleAddClient}>
              اولین مشتری را اضافه کنید
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredClients.map((client) => (
              <Card key={client.id} className="py-3">
                <CardContent className="flex items-center gap-3 px-4 py-0">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{client.name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1" dir="ltr">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </span>
                      {client.email && (
                        <span className="hidden sm:flex items-center gap-1 truncate" dir="ltr">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
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
                      {client.email && (
                        <DropdownMenuItem asChild>
                          <a href={`mailto:${client.email}`}>ایمیل</a>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
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
