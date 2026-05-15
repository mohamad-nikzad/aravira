import { and, asc, eq, inArray } from 'drizzle-orm'
import { PERSIAN_STARTER_SERVICE_TEMPLATES } from '@repo/salon-core/starter-service-templates'
import type {
  ComboComponent,
  ComboComponentsSummary,
  Service,
  ServiceCategory,
  ServiceFamily,
} from '@repo/salon-core/types'
import { getDb } from '../client'
import { serviceCategories, serviceComboComponents, serviceFamilies, services } from '../schema'
import { joinedRowToService, rowToServiceCategory, rowToServiceFamily } from './row-mappers'
import { isClientProvidedEntityId } from './client-queries'

type CreateCategoryInput = {
  id?: string
  salonId: string
  name: string
  active?: boolean
}

type UpdateCategoryInput = Partial<Pick<ServiceCategory, 'name' | 'active'>>

type CreateFamilyInput = {
  id?: string
  salonId: string
  categoryId: string
  name: string
  active?: boolean
}

type UpdateFamilyInput = Partial<Pick<ServiceFamily, 'categoryId' | 'name' | 'active'>>

export function validateComboComponentReplacement(input: {
  comboServiceId: string
  comboActive: boolean
  componentServiceIds: string[]
  foundComponents: Array<{ id: string; kind: Service['kind'] }>
}) {
  const { comboServiceId, comboActive, componentServiceIds, foundComponents } = input
  if (new Set(componentServiceIds).size !== componentServiceIds.length) {
    throw new Error('combo components cannot contain duplicates')
  }
  if (componentServiceIds.includes(comboServiceId)) {
    throw new Error('combo service cannot contain itself')
  }
  if (comboActive && componentServiceIds.length === 0) {
    throw new Error('active combo service must have at least one component')
  }
  if (foundComponents.length !== componentServiceIds.length) {
    throw new Error('combo component service not found')
  }
  if (foundComponents.some((row) => row.kind === 'combo')) {
    throw new Error('combo service cannot contain another combo service')
  }
}

async function countValidComboComponents(comboServiceId: string, salonId: string): Promise<number> {
  const db = getDb()
  const rows = await db
    .select({ id: serviceComboComponents.id })
    .from(serviceComboComponents)
    .innerJoin(
      services,
      and(
        eq(serviceComboComponents.componentServiceId, services.id),
        eq(services.salonId, salonId),
        eq(services.kind, 'standard')
      )
    )
    .where(
      and(
        eq(serviceComboComponents.salonId, salonId),
        eq(serviceComboComponents.comboServiceId, comboServiceId)
      )
    )
  return rows.length
}

async function assertActiveComboHasComponents(service: Pick<Service, 'id' | 'kind' | 'active'>, salonId: string) {
  if (service.kind !== 'combo' || !service.active) return
  const count = await countValidComboComponents(service.id, salonId)
  if (count === 0) {
    throw new Error('active combo service must have at least one component')
  }
}

export async function validateActiveServiceIds(ids: string[], salonId: string): Promise<boolean> {
  if (ids.length === 0) return true
  const db = getDb()
  const rows = await db
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.salonId, salonId), eq(services.active, true), inArray(services.id, ids)))
  return rows.length === ids.length
}

export async function getAllServices(salonId: string, includeInactive = false): Promise<Service[]> {
  const db = getDb()
  const rows = includeInactive
    ? await db
        .select({
          service: services,
          family: {
            id: serviceFamilies.id,
            name: serviceFamilies.name,
          },
          category: {
            id: serviceCategories.id,
            name: serviceCategories.name,
          },
        })
        .from(services)
        .leftJoin(serviceFamilies, eq(services.familyId, serviceFamilies.id))
        .leftJoin(serviceCategories, eq(serviceFamilies.categoryId, serviceCategories.id))
        .where(eq(services.salonId, salonId))
        .orderBy(asc(serviceCategories.name), asc(serviceFamilies.name), asc(services.name))
    : await db
        .select({
          service: services,
          family: {
            id: serviceFamilies.id,
            name: serviceFamilies.name,
          },
          category: {
            id: serviceCategories.id,
            name: serviceCategories.name,
          },
        })
        .from(services)
        .leftJoin(serviceFamilies, eq(services.familyId, serviceFamilies.id))
        .leftJoin(serviceCategories, eq(serviceFamilies.categoryId, serviceCategories.id))
        .where(and(eq(services.salonId, salonId), eq(services.active, true)))
        .orderBy(asc(serviceCategories.name), asc(serviceFamilies.name), asc(services.name))
  return rows.map(joinedRowToService)
}

export async function getServiceById(id: string, salonId: string): Promise<Service | undefined> {
  const db = getDb()
  const rows = await db
    .select({
      service: services,
      family: {
        id: serviceFamilies.id,
        name: serviceFamilies.name,
      },
      category: {
        id: serviceCategories.id,
        name: serviceCategories.name,
      },
    })
    .from(services)
    .leftJoin(serviceFamilies, eq(services.familyId, serviceFamilies.id))
    .leftJoin(serviceCategories, eq(serviceFamilies.categoryId, serviceCategories.id))
    .where(and(eq(services.id, id), eq(services.salonId, salonId)))
    .limit(1)
  const row = rows[0]
  return row ? joinedRowToService(row) : undefined
}

async function getActiveFamily(familyId: string, salonId: string) {
  const db = getDb()
  const [row] = await db
    .select({ id: serviceFamilies.id, categoryName: serviceCategories.name })
    .from(serviceFamilies)
    .innerJoin(serviceCategories, eq(serviceFamilies.categoryId, serviceCategories.id))
    .where(
      and(
        eq(serviceFamilies.id, familyId),
        eq(serviceFamilies.salonId, salonId),
        eq(serviceFamilies.active, true),
        eq(serviceCategories.active, true)
      )
    )
    .limit(1)
  return row
}

export async function createService(
  input: Pick<Service, 'name' | 'duration' | 'price' | 'color'> & {
    id?: string
    salonId: string
    familyId: string
    active?: boolean
    description?: string | null
    kind?: Service['kind']
  }
): Promise<Service> {
  const db = getDb()
  const family = await getActiveFamily(input.familyId, input.salonId)
  if (!family) throw new Error('service family not found or inactive')
  const values: typeof services.$inferInsert = {
    salonId: input.salonId,
    name: input.name,
    familyId: input.familyId,
    duration: input.duration,
    price: input.price,
    color: input.color,
    active: input.active ?? true,
    description: input.description ?? null,
    kind: input.kind ?? 'standard',
  }
  if (isClientProvidedEntityId(input.id)) {
    values.id = input.id
  }
  if ((values.kind ?? 'standard') === 'combo' && values.active !== false) {
    throw new Error('active combo service must have at least one component')
  }
  const [row] = await db.insert(services).values(values).returning()
  const service = await getServiceById(row.id, input.salonId)
  return service ?? joinedRowToService({ service: row, family: null, category: null })
}

export async function updateService(
  id: string,
  salonId: string,
  data: Partial<Omit<Service, 'id'>>
): Promise<Service | undefined> {
  const db = getDb()
  const existing = await getServiceById(id, salonId)
  if (!existing) return undefined
  if (data.familyId === null) throw new Error('service family is required')
  if (data.familyId !== undefined) {
    const family = await getActiveFamily(data.familyId, salonId)
    if (!family) throw new Error('service family not found or inactive')
  }
  await assertActiveComboHasComponents(
    {
      id,
      kind: data.kind ?? existing.kind ?? 'standard',
      active: data.active ?? existing.active,
    },
    salonId
  )
  const [row] = await db
    .update(services)
    .set({
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.familyId !== undefined ? { familyId: data.familyId } : {}),
      ...(data.duration !== undefined ? { duration: data.duration } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.kind !== undefined ? { kind: data.kind } : {}),
    })
    .where(and(eq(services.id, id), eq(services.salonId, salonId)))
    .returning()
  return row ? await getServiceById(row.id, salonId) : undefined
}

export async function getComboComponents(
  comboServiceId: string,
  salonId: string
): Promise<ComboComponentsSummary | undefined> {
  const combo = await getServiceById(comboServiceId, salonId)
  if (!combo || combo.kind !== 'combo') return undefined

  const db = getDb()
  const rows = await db
    .select({
      component: serviceComboComponents,
      service: services,
      family: {
        id: serviceFamilies.id,
        name: serviceFamilies.name,
      },
      category: {
        id: serviceCategories.id,
        name: serviceCategories.name,
      },
    })
    .from(serviceComboComponents)
    .innerJoin(
      services,
      and(
        eq(serviceComboComponents.componentServiceId, services.id),
        eq(services.salonId, salonId)
      )
    )
    .leftJoin(serviceFamilies, eq(services.familyId, serviceFamilies.id))
    .leftJoin(serviceCategories, eq(serviceFamilies.categoryId, serviceCategories.id))
    .where(
      and(
        eq(serviceComboComponents.salonId, salonId),
        eq(serviceComboComponents.comboServiceId, comboServiceId)
      )
    )
    .orderBy(asc(serviceComboComponents.sortOrder), asc(services.name))

  const components: ComboComponent[] = rows.map((row) => ({
    id: row.component.id,
    salonId: row.component.salonId,
    comboServiceId: row.component.comboServiceId,
    componentServiceId: row.component.componentServiceId,
    sortOrder: row.component.sortOrder,
    service: joinedRowToService({
      service: row.service,
      family: row.family,
      category: row.category,
    }),
    createdAt: row.component.createdAt,
    updatedAt: row.component.updatedAt,
  }))

  return {
    comboServiceId,
    components,
    totalDuration: components.reduce((sum, item) => sum + item.service.duration, 0),
    totalPrice: components.reduce((sum, item) => sum + item.service.price, 0),
  }
}

export async function replaceComboComponents(
  comboServiceId: string,
  salonId: string,
  componentServiceIds: string[]
): Promise<ComboComponentsSummary> {
  const combo = await getServiceById(comboServiceId, salonId)
  if (!combo || combo.kind !== 'combo') {
    throw new Error('combo service not found')
  }

  const db = getDb()
  const componentRows =
    componentServiceIds.length === 0
      ? []
      : await db
          .select({ id: services.id, kind: services.kind })
          .from(services)
          .where(and(eq(services.salonId, salonId), inArray(services.id, componentServiceIds)))

  validateComboComponentReplacement({
    comboServiceId,
    comboActive: combo.active,
    componentServiceIds,
    foundComponents: componentRows,
  })

  await db.transaction(async (tx) => {
    await tx
      .delete(serviceComboComponents)
      .where(
        and(
          eq(serviceComboComponents.salonId, salonId),
          eq(serviceComboComponents.comboServiceId, comboServiceId)
        )
      )

    if (componentServiceIds.length > 0) {
      await tx.insert(serviceComboComponents).values(
        componentServiceIds.map((componentServiceId, index) => ({
          salonId,
          comboServiceId,
          componentServiceId,
          sortOrder: index,
        }))
      )
    }
  })

  const summary = await getComboComponents(comboServiceId, salonId)
  if (!summary) throw new Error('combo service not found')
  return summary
}

export async function validateComboServiceIsBookable(
  serviceId: string,
  salonId: string
): Promise<boolean> {
  const service = await getServiceById(serviceId, salonId)
  if (!service || service.kind !== 'combo' || !service.active) return true
  return (await countValidComboComponents(serviceId, salonId)) > 0
}

export async function getAllServiceCategories(
  salonId: string,
  includeInactive = false
): Promise<ServiceCategory[]> {
  const db = getDb()
  const rows = await db
    .select()
    .from(serviceCategories)
    .where(
      includeInactive
        ? eq(serviceCategories.salonId, salonId)
        : and(eq(serviceCategories.salonId, salonId), eq(serviceCategories.active, true))
    )
    .orderBy(asc(serviceCategories.name))
  return rows.map(rowToServiceCategory)
}

export async function createServiceCategory(input: CreateCategoryInput): Promise<ServiceCategory> {
  const db = getDb()
  const values: typeof serviceCategories.$inferInsert = {
    salonId: input.salonId,
    name: input.name,
    active: input.active ?? true,
  }
  if (isClientProvidedEntityId(input.id)) values.id = input.id
  const [row] = await db.insert(serviceCategories).values(values).returning()
  return rowToServiceCategory(row)
}

export async function updateServiceCategory(
  id: string,
  salonId: string,
  data: UpdateCategoryInput
): Promise<ServiceCategory | undefined> {
  const db = getDb()
  const [row] = await db
    .update(serviceCategories)
    .set({
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(serviceCategories.id, id), eq(serviceCategories.salonId, salonId)))
    .returning()
  return row ? rowToServiceCategory(row) : undefined
}

export async function getAllServiceFamilies(
  salonId: string,
  includeInactive = false
): Promise<ServiceFamily[]> {
  const db = getDb()
  const rows = await db
    .select({
      id: serviceFamilies.id,
      categoryId: serviceFamilies.categoryId,
      categoryName: serviceCategories.name,
      name: serviceFamilies.name,
      active: serviceFamilies.active,
      createdAt: serviceFamilies.createdAt,
      updatedAt: serviceFamilies.updatedAt,
    })
    .from(serviceFamilies)
    .innerJoin(serviceCategories, eq(serviceFamilies.categoryId, serviceCategories.id))
    .where(
      includeInactive
        ? eq(serviceFamilies.salonId, salonId)
        : and(eq(serviceFamilies.salonId, salonId), eq(serviceFamilies.active, true))
    )
    .orderBy(asc(serviceCategories.name), asc(serviceFamilies.name))
  return rows.map(rowToServiceFamily)
}

export async function createServiceFamily(input: CreateFamilyInput): Promise<ServiceFamily> {
  const db = getDb()
  const [category] = await db
    .select({ id: serviceCategories.id })
    .from(serviceCategories)
    .where(and(eq(serviceCategories.id, input.categoryId), eq(serviceCategories.salonId, input.salonId)))
    .limit(1)
  if (!category) throw new Error('service category not found')
  const values: typeof serviceFamilies.$inferInsert = {
    salonId: input.salonId,
    categoryId: input.categoryId,
    name: input.name,
    active: input.active ?? true,
  }
  if (isClientProvidedEntityId(input.id)) values.id = input.id
  const [row] = await db.insert(serviceFamilies).values(values).returning()
  const family = (await getAllServiceFamilies(input.salonId, true)).find((item) => item.id === row.id)
  return family ?? rowToServiceFamily({ ...row, categoryName: null })
}

export async function updateServiceFamily(
  id: string,
  salonId: string,
  data: UpdateFamilyInput
): Promise<ServiceFamily | undefined> {
  const db = getDb()
  if (data.categoryId !== undefined) {
    const [category] = await db
      .select({ id: serviceCategories.id })
      .from(serviceCategories)
      .where(and(eq(serviceCategories.id, data.categoryId), eq(serviceCategories.salonId, salonId)))
      .limit(1)
    if (!category) throw new Error('service category not found')
  }
  const [row] = await db
    .update(serviceFamilies)
    .set({
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(serviceFamilies.id, id), eq(serviceFamilies.salonId, salonId)))
    .returning()
  if (!row) return undefined
  return (await getAllServiceFamilies(salonId, true)).find((item) => item.id === row.id)
}

export async function importStarterServiceTemplates(salonId: string): Promise<{
  categories: ServiceCategory[]
  families: ServiceFamily[]
  services: Service[]
}> {
  const categories: ServiceCategory[] = []
  const families: ServiceFamily[] = []
  const importedServices: Service[] = []

  for (const categoryTemplate of PERSIAN_STARTER_SERVICE_TEMPLATES) {
    let category = (await getAllServiceCategories(salonId, true)).find(
      (item) => item.name === categoryTemplate.category
    )
    if (!category) {
      category = await createServiceCategory({ salonId, name: categoryTemplate.category })
    }
    categories.push(category)

    for (const familyTemplate of categoryTemplate.families) {
      let family = (await getAllServiceFamilies(salonId, true)).find(
        (item) => item.categoryId === category.id && item.name === familyTemplate.name
      )
      if (!family) {
        family = await createServiceFamily({
          salonId,
          categoryId: category.id,
          name: familyTemplate.name,
        })
      }
      families.push(family)

      for (const serviceTemplate of familyTemplate.services) {
        const existingService = (await getAllServices(salonId, true)).find(
          (item) => item.name === serviceTemplate.name
        )
        if (existingService) {
          importedServices.push(existingService)
          continue
        }
        importedServices.push(
          await createService({
            salonId,
            familyId: family.id,
            active: true,
            kind: serviceTemplate.kind ?? 'standard',
            ...serviceTemplate,
          })
        )
      }
    }
  }

  return { categories, families, services: importedServices }
}
