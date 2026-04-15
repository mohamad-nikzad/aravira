import { NextResponse } from 'next/server'
import { isWebPushConfigured } from '@/lib/push'

export async function GET() {
  const configured = isWebPushConfigured()
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null
  return NextResponse.json({
    configured,
    publicKey: configured ? publicKey : null,
  })
}
