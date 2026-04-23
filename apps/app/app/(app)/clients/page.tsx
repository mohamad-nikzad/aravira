'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Plus, Search, Phone, MoreHorizontal } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@repo/ui/avatar'
import { Badge } from '@repo/ui/badge'
import { ClientDrawer } from '@/components/clients/client-drawer'
import { useAuth } from '@/components/auth-provider'
import {
  NetworkStatusBanner,
  OfflineStateCard,
} from '@/components/pwa/offline-state'
import { ClientsSkeleton } from '@/components/skeletons/clients-skeleton'
import {
  fetchJsonOrThrow,
  useNetworkStatus,
  useOfflineSnapshot,
} from '@/lib/pwa-client'
import { Client } from '@repo/salon-core/types'

async function fetcher<T>(url: string) {
  return fetchJsonOrThrow<T>(url)
}

type ClientsResponse = {
  clients: Client[]
}

export default function ClientsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const isOnline = useNetworkStatus()
  const [search, setSearch] = useState('')
  const [showDrawer, setShowDrawer] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  useEffect(() => {
    if (user && user.role !== 'manager') {
      router.replace('/calendar')
    }
  }, [user, router])

  const swrKey = user?.role === 'manager' ? '/api/clients' : null
  const {
    data: liveData,
    error,
    isLoading: clientsLoading,
    mutate,
  } = useSWR<ClientsResponse>(swrKey, fetcher)
  const snapshot = useOfflineSnapshot(swrKey ? 'clients:list' : null, liveData)
  const data = liveData ?? snapshot?.data
  const clients: Client[] = data?.clients || []

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.phone.includes(search)
  )

  const handleAddClient = () => {
    if (!isOnline) return
    setSelectedClient(null)
    setShowDrawer(true)
  }

  const handleEditClient = (client: Client) => {
    if (!isOnline) return
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

  if (clientsLoading && !data) {
    return <ClientsSkeleton />
  }

  if (!user || user.role !== 'manager') return null

  if (!data && !clientsLoading) {
    return (
      <div className="flex h-full flex-col bg-background">
        <header className="flex items-center justify-between gap-4 border-b border-border/50 bg-card px-4 py-3">
          <h1 className="text-lg font-bold">مشتریان</h1>
          <Button size="sm" disabled className="gap-1.5 touch-manipulation">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">مشتری جدید</span>
          </Button>
        </header>

        <NetworkStatusBanner
          routeLabel="فهرست مشتریان"
          isOnline={isOnline}
          hasSnapshot={Boolean(snapshot)}
          snapshotUpdatedAt={snapshot?.updatedAt}
          hasError={Boolean(error)}
          onRetry={() => void mutate()}
        />

        <OfflineStateCard
          title="فهرست مشتریان فعلا بارگذاری نشده است"
          description={
            isOnline
              ? 'دریافت فهرست مشتریان کامل نشد. دوباره تلاش کنید.'
              : 'برای اولین بارگذاری مشتریان باید دوباره به اینترنت متصل شوید.'
          }
          onAction={() => void mutate()}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center justify-between gap-4 bg-card px-4 py-3 border-b border-border/50">
        <h1 className="text-lg font-bold">مشتریان</h1>
        <Button
          size="sm"
          onClick={handleAddClient}
          disabled={!isOnline}
          className="gap-1.5 touch-manipulation"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">مشتری جدید</span>
        </Button>
      </header>

      <NetworkStatusBanner
        routeLabel="فهرست مشتریان"
        isOnline={isOnline}
        hasSnapshot={Boolean(snapshot)}
        snapshotUpdatedAt={snapshot?.updatedAt}
        hasError={Boolean(error)}
        onRetry={() => void mutate()}
      />

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
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/clients/${client.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') router.push(`/clients/${client.id}`)
                }}
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
                  {client.tags && client.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {client.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag.id} variant="outline" className="text-[10px] px-1.5 py-0">
                          {tag.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="touch-manipulation shrink-0"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)}>
                      پروفایل
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={!isOnline} onClick={() => handleEditClient(client)}>
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
