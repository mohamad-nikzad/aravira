import type {
  ComboComponentsSummary,
  Service,
  ServiceAddon,
  ServiceCategory,
  ServiceFamily,
} from '@repo/salon-core/types'
import type {
  ComboComponentsUpdateInput,
  ServiceAddonCreateInput as ServiceAddonCreateFormInput,
  ServiceAddonUpdateInput as ServiceAddonUpdateFormInput,
  ServiceCategoryCreateInput as ServiceCategoryCreateFormInput,
  ServiceCategoryUpdateInput as ServiceCategoryUpdateFormInput,
  ServiceCreateInput as ServiceCreateFormInput,
  ServiceFamilyCreateInput as ServiceFamilyCreateFormInput,
  ServiceFamilyUpdateInput as ServiceFamilyUpdateFormInput,
  ServiceUpdateInput as ServiceUpdateFormInput,
} from '@repo/salon-core/forms/service'
import type { ApiClient } from './client'
import { endpoints } from './endpoints'

export type ServicesResponse = {
  services: Service[]
}

export type ServiceResponse = {
  service: Service
}

export type ServiceCategoriesResponse = {
  categories: ServiceCategory[]
}

export type ServiceCategoryResponse = {
  category: ServiceCategory
}

export type ServiceFamiliesResponse = {
  families: ServiceFamily[]
}

export type ServiceFamilyResponse = {
  family: ServiceFamily
}

export type ComboComponentsResponse = {
  combo: ComboComponentsSummary
}

export type ServiceAddonsResponse = {
  addons: ServiceAddon[]
}

export type ServiceAddonResponse = {
  addon: ServiceAddon
}

export type ImportStarterServiceTemplatesResponse = {
  categories: ServiceCategory[]
  families: ServiceFamily[]
  services: Service[]
}

export type CreateServiceInput = ServiceCreateFormInput
export type UpdateServiceInput = ServiceUpdateFormInput
export type CreateServiceCategoryInput = ServiceCategoryCreateFormInput
export type UpdateServiceCategoryInput = ServiceCategoryUpdateFormInput
export type CreateServiceFamilyInput = ServiceFamilyCreateFormInput
export type UpdateServiceFamilyInput = ServiceFamilyUpdateFormInput
export type UpdateComboComponentsInput = ComboComponentsUpdateInput
export type CreateServiceAddonInput = ServiceAddonCreateFormInput
export type UpdateServiceAddonInput = ServiceAddonUpdateFormInput

export function createServicesApi(client: ApiClient) {
  return {
    list(opts: { includeInactive?: boolean; signal?: AbortSignal } = {}) {
      const path = opts.includeInactive ? `${endpoints.services}?all=1` : endpoints.services
      return client.request<ServicesResponse>(path, { signal: opts.signal })
    },
    get(id: string, opts: { signal?: AbortSignal } = {}) {
      return client.request<ServiceResponse>(`${endpoints.services}/${id}`, {
        signal: opts.signal,
      })
    },
    create(input: CreateServiceInput, opts: { signal?: AbortSignal } = {}) {
      return client.request<ServiceResponse>(endpoints.services, {
        method: 'POST',
        body: input,
        signal: opts.signal,
      })
    },
    update(id: string, input: UpdateServiceInput, opts: { signal?: AbortSignal } = {}) {
      return client.request<ServiceResponse>(`${endpoints.services}/${id}`, {
        method: 'PATCH',
        body: input,
        signal: opts.signal,
      })
    },
    comboComponents: {
      get(id: string, opts: { signal?: AbortSignal } = {}) {
        return client.request<ComboComponentsResponse>(
          `${endpoints.services}/${id}/combo-components`,
          { signal: opts.signal }
        )
      },
      update(
        id: string,
        input: UpdateComboComponentsInput,
        opts: { signal?: AbortSignal } = {}
      ) {
        return client.request<ComboComponentsResponse>(
          `${endpoints.services}/${id}/combo-components`,
          {
            method: 'PUT',
            body: input,
            signal: opts.signal,
          }
        )
      },
    },
    addons: {
      list(opts: { includeInactive?: boolean; signal?: AbortSignal } = {}) {
        const path = opts.includeInactive
          ? `${endpoints.serviceAddons}?all=1`
          : endpoints.serviceAddons
        return client.request<ServiceAddonsResponse>(path, { signal: opts.signal })
      },
      create(input: CreateServiceAddonInput, opts: { signal?: AbortSignal } = {}) {
        return client.request<ServiceAddonResponse>(endpoints.serviceAddons, {
          method: 'POST',
          body: input,
          signal: opts.signal,
        })
      },
      update(id: string, input: UpdateServiceAddonInput, opts: { signal?: AbortSignal } = {}) {
        return client.request<ServiceAddonResponse>(`${endpoints.serviceAddons}/${id}`, {
          method: 'PATCH',
          body: input,
          signal: opts.signal,
        })
      },
      forService(id: string, opts: { signal?: AbortSignal } = {}) {
        return client.request<ServiceAddonsResponse>(`${endpoints.services}/${id}/addons`, {
          signal: opts.signal,
        })
      },
    },
    categories: {
      list(opts: { includeInactive?: boolean; signal?: AbortSignal } = {}) {
        const path = opts.includeInactive
          ? `${endpoints.serviceCategories}?all=1`
          : endpoints.serviceCategories
        return client.request<ServiceCategoriesResponse>(path, { signal: opts.signal })
      },
      create(input: CreateServiceCategoryInput, opts: { signal?: AbortSignal } = {}) {
        return client.request<ServiceCategoryResponse>(endpoints.serviceCategories, {
          method: 'POST',
          body: input,
          signal: opts.signal,
        })
      },
      update(id: string, input: UpdateServiceCategoryInput, opts: { signal?: AbortSignal } = {}) {
        return client.request<ServiceCategoryResponse>(`${endpoints.serviceCategories}/${id}`, {
          method: 'PATCH',
          body: input,
          signal: opts.signal,
        })
      },
    },
    families: {
      list(opts: { includeInactive?: boolean; signal?: AbortSignal } = {}) {
        const path = opts.includeInactive
          ? `${endpoints.serviceFamilies}?all=1`
          : endpoints.serviceFamilies
        return client.request<ServiceFamiliesResponse>(path, { signal: opts.signal })
      },
      create(input: CreateServiceFamilyInput, opts: { signal?: AbortSignal } = {}) {
        return client.request<ServiceFamilyResponse>(endpoints.serviceFamilies, {
          method: 'POST',
          body: input,
          signal: opts.signal,
        })
      },
      update(id: string, input: UpdateServiceFamilyInput, opts: { signal?: AbortSignal } = {}) {
        return client.request<ServiceFamilyResponse>(`${endpoints.serviceFamilies}/${id}`, {
          method: 'PATCH',
          body: input,
          signal: opts.signal,
        })
      },
    },
    importStarterTemplates(opts: { signal?: AbortSignal } = {}) {
      return client.request<ImportStarterServiceTemplatesResponse>(
        endpoints.importStarterServiceTemplates,
        {
          method: 'POST',
          signal: opts.signal,
        }
      )
    },
  }
}

export type ServicesApi = ReturnType<typeof createServicesApi>
