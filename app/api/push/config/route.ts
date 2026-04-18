import { NextResponse } from 'next/server'
import { isWebPushConfigured } from '@/lib/push'
import { getTenantUser } from '@/lib/server/auth/tenant'

export async function GET() {
  try {
    const user = await getTenantUser()
    if (!user) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
    }

    const configured = isWebPushConfigured()
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null
    return NextResponse.json({
      configured,
      publicKey: configured ? publicKey : null,
    })
  } catch (error) {
    console.error('Push config error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
