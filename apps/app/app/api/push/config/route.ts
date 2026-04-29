import { NextResponse } from 'next/server'
import { isWebPushConfigured } from '@/lib/push'
import { getTenantRequest } from '@repo/auth/tenant'

export async function GET() {
  try {
    const tenant = await getTenantRequest()
    if (!tenant.ok) return tenant.response

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
