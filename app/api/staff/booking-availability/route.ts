import { NextResponse } from 'next/server'
import { getStaffBookingAvailabilityForSlot } from '@/lib/db'
import { validateAppointmentWindow } from '@/lib/appointment-time'
import { getTenantUser, isManagerRole } from '@/lib/server/auth/tenant'

export async function GET(request: Request) {
  try {
    const user = await getTenantUser()
    if (!user || !isManagerRole(user.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')

    if (!date || !startTime || !endTime) {
      return NextResponse.json({ error: 'تاریخ و ساعت شروع و پایان الزامی است' }, { status: 400 })
    }

    const windowCheck = validateAppointmentWindow(startTime, endTime)
    if (!windowCheck.ok) {
      return NextResponse.json({ error: windowCheck.error }, { status: 400 })
    }

    const staff = await getStaffBookingAvailabilityForSlot(
      user.salonId,
      date,
      startTime,
      endTime
    )
    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Staff booking availability error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
