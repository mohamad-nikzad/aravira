import type { PaginationState } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Field, FieldLabel } from '#/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  PAGE_SIZE_OPTIONS,
  type PageSizeOption,
} from '#/lib/admin-search-schemas'

export function DataTablePagination({
  pagination,
  pageCount,
  onPaginationChange,
  totalRows,
  onPageSizeChange,
}: {
  pagination: PaginationState
  pageCount: number
  onPaginationChange: (pagination: PaginationState) => void
  totalRows?: number
  onPageSizeChange?: (pageSize: PageSizeOption) => void
}) {
  const page = pagination.pageIndex + 1
  const rowTotal = totalRows ?? 0
  const showRange = totalRows !== undefined
  const start = rowTotal === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const end =
    rowTotal === 0
      ? 0
      : Math.min((pagination.pageIndex + 1) * pagination.pageSize, rowTotal)

  return (
    <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        {showRange ? (
          <div>
            نمایش {start} تا {end} از {totalRows}
          </div>
        ) : (
          <div>
            صفحه {page} از {Math.max(pageCount, 1)}
          </div>
        )}
        {onPageSizeChange ? (
          <Field orientation="horizontal" className="items-center">
            <FieldLabel>تعداد در هر صفحه</FieldLabel>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) =>
                onPageSizeChange(Number(value) as PageSizeOption)
              }
            >
              <SelectTrigger
                className="h-8 w-20"
                aria-label="تعداد در هر صفحه"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.pageIndex <= 0}
          onClick={() => onPaginationChange({ ...pagination, pageIndex: pagination.pageIndex - 1 })}
        >
          <ChevronRight data-icon="inline-start" />
          قبلی
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPaginationChange({ ...pagination, pageIndex: pagination.pageIndex + 1 })}
        >
          بعدی
          <ChevronLeft data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
