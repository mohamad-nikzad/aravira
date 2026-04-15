'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Check, ChevronDown, Plus, Search, UserPlus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { Client } from '@/lib/types'

interface ClientPickerProps {
  clients: Client[]
  value: string
  onChange: (clientId: string) => void
  onClientCreated: (client: Client) => void
}

type PickerMode = 'closed' | 'searching' | 'adding'

export function ClientPicker({
  clients,
  value,
  onChange,
  onClientCreated,
}: ClientPickerProps) {
  const [mode, setMode] = useState<PickerMode>('closed')
  const [query, setQuery] = useState('')
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedClient = clients.find((c) => c.id === value)

  const filtered = useMemo(() => {
    if (!query.trim()) return clients
    const q = query.trim().toLowerCase()
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    )
  }, [clients, query])

  const hasExactMatch = useMemo(() => {
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    return clients.some(
      (c) => c.name.toLowerCase() === q || c.phone === q.replace(/\s/g, '')
    )
  }, [clients, query])

  useEffect(() => {
    if (mode === 'searching') {
      requestAnimationFrame(() => searchRef.current?.focus())
    }
  }, [mode])

  useEffect(() => {
    if (mode === 'closed') return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
        setMode('closed')
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [mode])

  const openSearch = () => {
    setQuery('')
    setSaveError('')
    setMode('searching')
  }

  const selectClient = (id: string) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    onChange(id)
    setMode('closed')
    setQuery('')
  }

  const startAdding = () => {
    const q = query.trim()
    const looksLikePhone = /^[\d۰-۹\s+()-]{4,}$/.test(q)
    setNewName(looksLikePhone ? '' : q)
    setNewPhone(looksLikePhone ? q.replace(/[^\d۰-۹+]/g, '') : '')
    setSaveError('')
    setMode('adding')
  }

  const cancelAdding = () => {
    setMode('searching')
    setSaveError('')
  }

  const handleSaveNew = async () => {
    if (!newName.trim() || !newPhone.trim()) return
    setSaving(true)
    setSaveError('')

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSaveError(data.error || 'خطا در ثبت مشتری')
        return
      }

      const created: Client = data.client
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
      onClientCreated(created)
      onChange(created.id)
      setMode('closed')
      setQuery('')
      setNewName('')
      setNewPhone('')
    } catch {
      setSaveError('خطایی رخ داد')
    } finally {
      setSaving(false)
    }
  }

  if (mode === 'closed') {
    return (
      <button
        type="button"
        onClick={openSearch}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-sm transition-colors touch-manipulation',
          'hover:border-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
          !selectedClient && 'text-muted-foreground'
        )}
      >
        <span className="truncate">
          {selectedClient
            ? `${selectedClient.name} · ${selectedClient.phone}`
            : 'انتخاب مشتری...'}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
    )
  }

  return (
    <div ref={containerRef} className="rounded-xl border border-primary/30 bg-card shadow-sm overflow-hidden">
      {mode === 'searching' && (
        <>
          <div className="flex items-center gap-2 border-b border-border/60 px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجو نام یا شماره..."
              className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-muted-foreground touch-manipulation"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-[180px] overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => selectClient(client.id)}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors touch-manipulation text-right',
                    'hover:bg-accent/50 active:bg-accent',
                    client.id === value && 'bg-primary/5'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-[13px]">{client.name}</p>
                    <p className="text-[11px] text-muted-foreground" dir="ltr">{client.phone}</p>
                  </div>
                  {client.id === value && (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                مشتری‌ای یافت نشد
              </div>
            )}
          </div>

          <div className="border-t border-border/60">
            {!hasExactMatch && query.trim() ? (
              <button
                type="button"
                onClick={startAdding}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-primary transition-colors touch-manipulation hover:bg-primary/5 active:bg-primary/10"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <UserPlus className="h-3.5 w-3.5" />
                </div>
                <span>افزودن «{query.trim()}» به عنوان مشتری جدید</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startAdding}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-muted-foreground transition-colors touch-manipulation hover:bg-accent/50 active:bg-accent"
              >
                <Plus className="h-4 w-4" />
                <span>مشتری جدید</span>
              </button>
            )}
          </div>
        </>
      )}

      {mode === 'adding' && (
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">مشتری جدید</p>
            <button
              type="button"
              onClick={cancelAdding}
              className="text-xs text-muted-foreground hover:text-foreground touch-manipulation"
            >
              بازگشت
            </button>
          </div>

          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="نام مشتری"
            className="h-10"
            autoFocus
          />

          <Input
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="شماره تماس (09...)"
            type="tel"
            inputMode="numeric"
            dir="ltr"
            className="h-10 text-left"
          />

          {saveError && (
            <p className="text-xs text-destructive">{saveError}</p>
          )}

          <Button
            type="button"
            size="sm"
            className="w-full touch-manipulation"
            disabled={saving || !newName.trim() || !newPhone.trim()}
            onClick={handleSaveNew}
          >
            {saving ? <Spinner className="ml-1.5 h-3.5 w-3.5" /> : <Plus className="ml-1.5 h-3.5 w-3.5" />}
            {saving ? 'در حال ذخیره...' : 'ذخیره و انتخاب'}
          </Button>
        </div>
      )}
    </div>
  )
}
