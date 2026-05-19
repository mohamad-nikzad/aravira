import { NextResponse } from 'next/server'
import { getAllClients, createClient, setClientTags, isClientProvidedEntityId } from '@repo/database/clients'
import { getTenantManagerRequest } from '@repo/auth/tenant-next'
import { clientCreateSchema } from '@repo/salon-core/forms/client'
import { validationErrorResponse } from '../validation'

export async function GET(request: Request) {
  try {
    const tenant = await getTenantManagerRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const clients = await getAllClients(user.salonId)
    return NextResponse.json({ clients })
  } catch (error) {
    console.error('Get clients error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await getTenantManagerRequest(request)
    if (!tenant.ok) return tenant.response
    const { user } = tenant

    const parsed = clientCreateSchema.safeParse(await request.json())
    if (!parsed.success) return validationErrorResponse(parsed.error)
    const { name, phone, notes, tags, id: requestedId } = parsed.data

    const client = await createClient({
      name,
      phone,
      notes,
      salonId: user.salonId,
      ...(isClientProvidedEntityId(requestedId) ? { id: requestedId } : {}),
    })
    const savedTags = await setClientTags(client.id, user.salonId, tags)
    return NextResponse.json({ client: { ...client, tags: savedTags } })
  } catch (error: unknown) {
    console.error('Create client error:', error)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json(
        { error: 'این شماره تماس برای این سالن قبلاً ثبت شده است', code: 'duplicate-phone' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
