import { ClientImportPreviewSheet } from '#/components/clients/client-import-preview-sheet'
import type { useClientImport } from '#/lib/use-client-import'

type ClientImportFlow = ReturnType<typeof useClientImport>

export function ClientImportPreviewSheetHost({
  importFlow,
}: {
  importFlow: ClientImportFlow
}) {
  const counts = importFlow.counts
  if (importFlow.step !== 'preview' || counts == null) return null

  const handlePreviewOpenChange = (open: boolean) => {
    if (!open && !importFlow.bulkCreate.isPending) {
      importFlow.resetPreview()
    }
  }

  return (
    <ClientImportPreviewSheet
      open
      onOpenChange={handlePreviewOpenChange}
      previewSource={importFlow.previewSource}
      counts={counts}
      rows={importFlow.rows}
      skippedRows={importFlow.skippedRows}
      search={importFlow.search}
      onSearchChange={importFlow.setSearch}
      filter={importFlow.filter}
      onFilterChange={importFlow.setFilter}
      onUpdateRow={importFlow.updateRow}
      onRowBlur={importFlow.handleRowBlur}
      onToggleSelectAll={importFlow.toggleSelectAll}
      selectAllState={importFlow.selectAllState}
      onSubmit={importFlow.handleSubmit}
      onResetPreview={importFlow.resetPreview}
      isSubmitting={importFlow.bulkCreate.isPending}
      submitCount={importFlow.submitCount}
    />
  )
}
