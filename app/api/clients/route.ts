import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getAllClients, createClient, updateClient, getClientById } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }

    const clients = getAllClients()
    return NextResponse.json({ clients })
  } catch (error) {
    console.error('Get clients error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, notes } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'نام و شماره تماس الزامی است' },
        { status: 400 }
      )
    }

    const client = createClient({ name, email, phone, notes })
    return NextResponse.json({ client })
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
