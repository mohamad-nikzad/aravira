import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getBusinessSettings, updateBusinessSettings } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }

    const settings = await getBusinessSettings()
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Get business settings error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const body = await request.json()
    const { workingStart, workingEnd, slotDurationMinutes } = body

    const next = await updateBusinessSettings({
      ...(typeof workingStart === 'string' ? { workingStart } : {}),
      ...(typeof workingEnd === 'string' ? { workingEnd } : {}),
      ...(typeof slotDurationMinutes === 'number' ? { slotDurationMinutes } : {}),
    })

    return NextResponse.json({ settings: next })
  } catch (error) {
    console.error('Update business settings error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
