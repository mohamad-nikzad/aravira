import { NextResponse } from 'next/server'
import { getAllClients, createClient, setClientTags } from '@/lib/db'
import { getTenantUser, isManagerRole } from '@/lib/server/auth/tenant'

export async function GET() {
  try {
    const user = await getTenantUser()
    if (!user) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }
    if (!isManagerRole(user.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const clients = await getAllClients(user.salonId)
    return NextResponse.json({ clients })
  } catch (error) {
    console.error('Get clients error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getTenantUser()
    if (!user || !isManagerRole(user.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const body = await request.json()
    const { name, phone, notes, tags } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'نام و شماره تماس الزامی است' }, { status: 400 })
    }

    const client = await createClient({ name, phone, notes, salonId: user.salonId })
    const savedTags = Array.isArray(tags)
      ? await setClientTags(client.id, user.salonId, tags.map(String))
      : []
    return NextResponse.json({ client: { ...client, tags: savedTags } })
  } catch (error: unknown) {
    console.error('Create client error:', error)
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'این شماره تماس برای این سالن قبلاً ثبت شده است' }, { status: 409 })
    }
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
