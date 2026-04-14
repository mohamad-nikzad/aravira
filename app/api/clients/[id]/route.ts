import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getClientById, updateClient } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const { id } = await params
    const client = await getClientById(id)

    if (!client) {
      return NextResponse.json({ error: 'مشتری یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ client })
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
    const user = await getCurrentUser()
    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, phone, notes } = body

    const client = await updateClient(id, { name, phone, notes })

    if (!client) {
      return NextResponse.json({ error: 'مشتری یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Update client error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
