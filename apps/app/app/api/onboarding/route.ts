import { NextResponse } from 'next/server'
import { getOnboardingStatus, updateOnboardingState, type OnboardingAction } from '@repo/database/onboarding'
import { getTenantUser, isManagerRole } from '@repo/auth/tenant'

const actions = new Set<OnboardingAction>(['confirm-profile', 'complete', 'skip', 'reopen'])

export async function GET() {
  try {
    const user = await getTenantUser()
    if (!user || !isManagerRole(user.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const onboarding = await getOnboardingStatus(user.salonId)
    return NextResponse.json({ onboarding })
  } catch (error) {
    console.error('Get onboarding error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getTenantUser()
    if (!user || !isManagerRole(user.role)) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const body = await request.json()
    const action = String(body.action ?? '') as OnboardingAction
    if (!actions.has(action)) {
      return NextResponse.json({ error: 'درخواست نامعتبر است' }, { status: 400 })
    }

    const onboarding = await updateOnboardingState(user.salonId, action)
    return NextResponse.json({ onboarding })
  } catch (error) {
    console.error('Update onboarding error:', error)
    return NextResponse.json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' }, { status: 500 })
  }
}
