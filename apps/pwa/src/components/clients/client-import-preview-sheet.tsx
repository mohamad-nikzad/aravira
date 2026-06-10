import { Button } from '@repo/ui/button'
import { Spinner } from '@repo/ui/spinner'
import {
  type ClientImportCounts,
  type ClientImportPreviewRow,
  type ClientImportSkippedRow,
} from '@repo/salon-core'
import { toPersianDigits } from '@repo/salon-core/persian-digits'

import { ClientImportPreviewList } from '#/components/clients/client-import-preview-list'
import {
  FormSheet,
  FormSheetContent,
  FormSheetDescription,
  FormSheetFooter,
  FormSheetHeader,
  FormSheetTitle,
} from '#/components/form-sheet'
import type { ImportPreviewFilter } from '#/lib/client-import'

type ClientImportPreviewSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  previewSource: 'file' | 'device' | null
  counts: ClientImportCounts
  rows: ClientImportPreviewRow[]
  skippedRows: ClientImportSkippedRow[]
  search: string
  onSearchChange: (value: string) => void
  filter: ImportPreviewFilter
  onFilterChange: (filter: ImportPreviewFilter) => void
  onUpdateRow: (localId: string, patch: Partial<ClientImportPreviewRow>) => void
  onRowBlur: (localId: string) => void
  onToggleSelectAll: () => void
  selectAllState: boolean | 'indeterminate'
  onSubmit: () => void
  onResetPreview: () => void
  isSubmitting: boolean
  submitCount: number
}

export function ClientImportPreviewSheet({
  open,
  onOpenChange,
  previewSource,
  counts,
  rows,
  skippedRows,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  onUpdateRow,
  onRowBlur,
  onToggleSelectAll,
  selectAllState,
  onSubmit,
  onResetPreview,
  isSubmitting,
  submitCount,
}: ClientImportPreviewSheetProps) {
  const requestClose = () => {
    if (isSubmitting) return
    onOpenChange(false)
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isSubmitting) return
        onOpenChange(nextOpen)
      }}
    >
      <FormSheetContent onRequestClose={requestClose}>
        <FormSheetHeader>
          <FormSheetTitle>پیش‌نمایش و انتخاب مشتریان</FormSheetTitle>
          <FormSheetDescription>
            موارد قابل افزودن را بررسی و انتخاب کنید
          </FormSheetDescription>
        </FormSheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ClientImportPreviewList
            counts={counts}
            rows={rows}
            skippedRows={skippedRows}
            search={search}
            onSearchChange={onSearchChange}
            filter={filter}
            onFilterChange={onFilterChange}
            onUpdateRow={onUpdateRow}
            onRowBlur={onRowBlur}
            onToggleSelectAll={onToggleSelectAll}
            selectAllState={selectAllState}
          />
        </div>

        <FormSheetFooter className="flex-row gap-2">
          {previewSource === 'file' ? (
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={onResetPreview}
              disabled={isSubmitting}
            >
              بازگشت به راهنما
            </Button>
          ) : null}
          <Button
            onClick={() => void onSubmit()}
            disabled={isSubmitting || submitCount === 0}
            className="min-w-0 flex-1 touch-manipulation"
          >
            {isSubmitting && <Spinner className="ml-2" />}
            {isSubmitting
              ? 'در حال افزودن…'
              : `افزودن ${toPersianDigits(submitCount)} مشتری`}
          </Button>
        </FormSheetFooter>
      </FormSheetContent>
    </FormSheet>
  )
}
