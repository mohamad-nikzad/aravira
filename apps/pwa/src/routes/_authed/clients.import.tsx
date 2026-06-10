import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeaderBackButton } from '#/components/page-header-back-button'

import { ClientImportGuidesAccordion } from '#/components/clients/client-import-guides-accordion'
import { ClientImportPreviewSheetHost } from '#/components/clients/client-import-preview-sheet-host'
import {
  clientsListQueryOptions,
  getApiV1ClientsQueryKey,
} from '#/lib/clients-queries'
import { useClientImport } from '#/lib/use-client-import'

export const Route = createFileRoute('/_authed/clients/import')({
  component: ClientImportPage,
})

function ClientImportPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: clients = [] } = useQuery(clientsListQueryOptions())

  const importFlow = useClientImport({
    existingClients: clients,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getApiV1ClientsQueryKey(),
      })
      navigate({ to: '/clients' })
    },
  })

  const handleBack = () => {
    if (importFlow.bulkCreate.isPending) return
    navigate({ to: '/clients' })
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-line-soft bg-card px-4 py-3">
        <PageHeaderBackButton
          aria-label="بازگشت"
          onClick={handleBack}
          disabled={importFlow.bulkCreate.isPending}
        />
        <div className="min-w-0">
          <h1 className="text-lg font-extrabold text-foreground">
            افزودن گروهی مشتریان
          </h1>
          <p className="text-[12px] text-muted-foreground">
            اول راهنما، بعد انتخاب فایل
          </p>
        </div>
      </header>

      <input
        ref={importFlow.fileInputRef}
        type="file"
        accept=".vcf,text/vcard"
        className="hidden"
        onChange={importFlow.handleFileChange}
      />

      <ClientImportGuidesAccordion onPickFile={importFlow.pickFile} />

      <ClientImportPreviewSheetHost importFlow={importFlow} />
    </div>
  )
}
