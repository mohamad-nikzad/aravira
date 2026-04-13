import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getAllServices } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }

    const services = getAllServices()
    return NextResponse.json({ services })
  } catch (error) {
    console.error('Get services error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
