import { NextResponse } from 'next/server'
import { getClientById, getClientTags, setClientTags, updateClient } from '@/lib/db'
import { getTenantUser, isManagerRole } from '@/lib/server/auth/tenant'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTenantUser()
    if (!user || !isManagerRole(user.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const { id } = await params
    const client = await getClientById(id, user.salonId)

    if (!client) {
      return NextResponse.json({ error: 'مشتری یافت نشد' }, { status: 404 })
    }

    const tags = await getClientTags(id, user.salonId)
    return NextResponse.json({ client: { ...client, tags } })
  } catch (error) {
    console.error('Get client error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTenantUser()
    if (!user || !isManagerRole(user.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, phone, notes, tags } = body

    const client = await updateClient(id, user.salonId, { name, phone, notes })

    if (!client) {
      return NextResponse.json({ error: 'مشتری یافت نشد' }, { status: 404 })
    }

    const savedTags = Array.isArray(tags)
      ? await setClientTags(id, user.salonId, tags.map(String))
      : await getClientTags(id, user.salonId)

    return NextResponse.json({ client: { ...client, tags: savedTags } })
  } catch (error: unknown) {
    console.error('Update client error:', error)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'این شماره تماس برای این سالن قبلاً ثبت شده است' }, { status: 409 })
    }
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
