import { getApiV1AdminUsersOptions } from '@repo/api-client/query'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useId, useRef, useState } from 'react'

import { Button } from '#/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '#/components/ui/command'
import { Field, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '#/components/ui/popover'
import { text } from '#/lib/admin-format'

const SEARCH_DEBOUNCE_MS = 300
const RESULT_PAGE_SIZE = 20

type UserRow = Record<string, unknown>

type DisplayUser = {
  userId: string
  name?: string
  email?: string
  phoneNumber?: string
}

export function UserPicker({
  name = 'userId',
  readOnly = false,
  displayUser,
  required = false,
}: {
  name?: string
  readOnly?: boolean
  displayUser?: DisplayUser
  required?: boolean
}) {
  if (readOnly && displayUser) {
    return <UserPickerReadOnly name={name} user={displayUser} />
  }

  return <UserPickerSearch name={name} required={required} />
}

function UserPickerReadOnly({
  name,
  user,
}: {
  name: string
  user: DisplayUser
}) {
  const labelId = useId()

  return (
    <Field>
      <FieldLabel id={labelId}>کاربر</FieldLabel>
      <div
        aria-labelledby={labelId}
        className="rounded-md border border-input bg-muted/30 px-3 py-2"
      >
        <div className="font-medium">{user.name || '-'}</div>
        <dl className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
          {user.email ? (
            <div>
              <dt className="sr-only">ایمیل</dt>
              <dd>ایمیل: {user.email}</dd>
            </div>
          ) : null}
          {user.phoneNumber ? (
            <div>
              <dt className="sr-only">تلفن</dt>
              <dd>تلفن: {user.phoneNumber}</dd>
            </div>
          ) : null}
          <div>
            <dt className="sr-only">شناسه کاربر</dt>
            <dd>شناسه کاربر: {user.userId}</dd>
          </div>
        </dl>
      </div>
      <input type="hidden" name={name} value={user.userId} />
    </Field>
  )
}

function UserPickerSearch({
  name,
  required,
}: {
  name: string
  required?: boolean
}) {
  const searchFieldId = useId()
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const debounceRef = useRef<number | undefined>(undefined)

  const usersQuery = useQuery({
    ...getApiV1AdminUsersOptions({
      query: {
        page: 1,
        pageSize: RESULT_PAGE_SIZE,
        search: debouncedSearch || undefined,
      },
    }),
    enabled: isOpen && debouncedSearch.length > 0,
  })

  const users = usersQuery.data?.items ?? []

  useEffect(() => {
    return () => {
      window.clearTimeout(debounceRef.current)
    }
  }, [])

  function handleSearchChange(value: string) {
    setSearchInput(value)
    setSelectedUser(null)
    setIsOpen(true)
    window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      setDebouncedSearch(value.trim())
    }, SEARCH_DEBOUNCE_MS)
  }

  function handleSelect(user: UserRow) {
    setSelectedUser(user)
    setSearchInput(userLabel(user))
    setDebouncedSearch('')
    setIsOpen(false)
  }

  function handleClearSelection() {
    setSelectedUser(null)
    setSearchInput('')
    setDebouncedSearch('')
    setIsOpen(false)
  }

  const selectedUserId = selectedUser ? text(selectedUser.id) : ''

  return (
    <Field>
      <FieldLabel htmlFor={searchFieldId}>کاربر</FieldLabel>
      <Popover open={isOpen && debouncedSearch.length > 0} onOpenChange={setIsOpen}>
        <PopoverAnchor asChild>
          <Input
            id={searchFieldId}
            value={searchInput}
            onChange={(event) => handleSearchChange(event.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="جستجو بر اساس نام، ایمیل، تلفن یا نام کاربری..."
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen && debouncedSearch.length > 0}
            aria-autocomplete="list"
          />
        </PopoverAnchor>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <Command shouldFilter={false}>
            <CommandList>
              {usersQuery.isLoading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  در حال جستجوی کاربران...
                </div>
              ) : null}
              {!usersQuery.isLoading && usersQuery.isError ? (
                <div className="px-3 py-2 text-sm text-destructive">
                  بارگذاری کاربران ناموفق بود.
                </div>
              ) : null}
              {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 ? (
                <CommandEmpty>کاربری یافت نشد.</CommandEmpty>
              ) : null}
              {!usersQuery.isLoading && !usersQuery.isError && users.length > 0 ? (
                <CommandGroup>
                  {users.map((user) => {
                    const id = text(user.id)
                    return (
                      <CommandItem
                        key={id}
                        value={id}
                        onSelect={() => handleSelect(user)}
                      >
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="font-medium">{userLabel(user)}</span>
                          <span className="text-xs text-muted-foreground">
                            {userDetails(user)}
                          </span>
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <input
        type="hidden"
        name={name}
        value={selectedUserId}
        required={required}
      />
      {selectedUser ? (
        <SelectedUserSummary user={selectedUser} onClear={handleClearSelection} />
      ) : null}
    </Field>
  )
}

function SelectedUserSummary({
  user,
  onClear,
}: {
  user: UserRow
  onClear: () => void
}) {
  return (
    <div className="rounded-md border border-border/80 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-foreground">{userLabel(user)}</div>
          <div className="mt-0.5 truncate">{userDetails(user)}</div>
        </div>
        <Button type="button" variant="link" size="sm" onClick={onClear}>
          تغییر
        </Button>
      </div>
    </div>
  )
}

function userLabel(user: UserRow): string {
  return text(user.name) || text(user.username) || 'کاربر بدون نام'
}

function userDetails(user: UserRow): string {
  return [
    text(user.email),
    text(user.phoneNumber),
    `شناسه: ${text(user.id)}`,
  ]
    .filter(Boolean)
    .join(' · ')
}
