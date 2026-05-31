import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findAccountByExternalId: vi.fn(),
  getAppointmentRequestForCallback: vi.fn(),
  approveAppointmentRequest: vi.fn(),
  rejectAppointmentRequest: vi.fn(),
  getMemberForUser: vi.fn(),
  findSoleCapableStaffUserId: vi.fn(),
  salonCurrentHm: vi.fn(() => '14:32'),
}))

vi.mock('@repo/database/messaging', () => ({
  findAccountByExternalId: mocks.findAccountByExternalId,
}))

vi.mock('@repo/database/appointment-requests', () => ({
  approveAppointmentRequest: mocks.approveAppointmentRequest,
  rejectAppointmentRequest: mocks.rejectAppointmentRequest,
  getAppointmentRequestForCallback: mocks.getAppointmentRequestForCallback,
}))

vi.mock('@repo/database/members', () => ({
  getMemberForUser: mocks.getMemberForUser,
}))

vi.mock('@repo/database/staff', () => ({
  findSoleCapableStaffUserId: mocks.findSoleCapableStaffUserId,
}))

vi.mock('@repo/salon-core/salon-local-time', () => ({
  salonCurrentHm: mocks.salonCurrentHm,
}))

import { handleApprovalCallback, handleRejectionCallback } from './approval'

const linkedAccount = {
  id: 'acc-1',
  userId: 'mgr-1',
  provider: 'telegram' as const,
  externalId: '42',
  displayName: '@mo',
  enabled: true,
  linkedAt: new Date(),
  updatedAt: new Date(),
}

const pendingRequest = {
  requestId: 'req-1',
  salonId: 'salon-1',
  status: 'pending' as const,
  serviceId: 'svc-1',
  customerName: 'Roya',
  requestedDate: '2026-06-02',
  requestedStartTime: '10:00',
}

const managerMember = {
  userId: 'mgr-1',
  organizationId: 'salon-1',
  role: 'owner',
  name: 'مهدی',
  username: '09120000000',
}

beforeEach(() => {
  Object.values(mocks).forEach((m) => 'mockReset' in m && (m as { mockReset: () => void }).mockReset())
  mocks.salonCurrentHm.mockReturnValue('14:32')
})

afterEach(() => vi.clearAllMocks())

describe('handleApprovalCallback', () => {
  it('approves when one capable staff exists', async () => {
    mocks.findAccountByExternalId.mockResolvedValue(linkedAccount)
    mocks.getAppointmentRequestForCallback.mockResolvedValue(pendingRequest)
    mocks.getMemberForUser.mockResolvedValue(managerMember)
    mocks.findSoleCapableStaffUserId.mockResolvedValue('staff-99')
    mocks.approveAppointmentRequest.mockResolvedValue({
      ok: true,
      appointmentId: 'apt-1',
      clientId: 'cli-1',
    })

    const outcome = await handleApprovalCallback({
      provider: 'telegram',
      externalId: '42',
      requestId: 'req-1',
    })

    expect(mocks.approveAppointmentRequest).toHaveBeenCalledWith({
      id: 'req-1',
      salonId: 'salon-1',
      staffId: 'staff-99',
      reviewedByUserId: 'mgr-1',
    })
    expect(outcome.messageHtml).toContain('✅')
    expect(outcome.messageHtml).toContain('مهدی')
    expect(outcome.messageHtml).toContain('14:32')
    expect(outcome.replacementKeyboard).toBeNull()
    expect(outcome.toast).toBe('تأیید شد')
  })

  it('returns needs_app when multiple staff are capable', async () => {
    mocks.findAccountByExternalId.mockResolvedValue(linkedAccount)
    mocks.getAppointmentRequestForCallback.mockResolvedValue(pendingRequest)
    mocks.getMemberForUser.mockResolvedValue(managerMember)
    mocks.findSoleCapableStaffUserId.mockResolvedValue(null)

    const outcome = await handleApprovalCallback({
      provider: 'telegram',
      externalId: '42',
      requestId: 'req-1',
      publicAppBaseUrl: 'https://app.example',
    })

    expect(mocks.approveAppointmentRequest).not.toHaveBeenCalled()
    expect(outcome.messageHtml).toContain('برنامه')
    expect(outcome.replacementKeyboard).toEqual([
      [{ label: 'مشاهده در برنامه', url: 'https://app.example/appointment-requests?focus=req-1' }],
    ])
  })

  it('short-circuits when the request is no longer pending', async () => {
    mocks.findAccountByExternalId.mockResolvedValue(linkedAccount)
    mocks.getAppointmentRequestForCallback.mockResolvedValue({
      ...pendingRequest,
      status: 'approved' as const,
    })
    mocks.getMemberForUser.mockResolvedValue(managerMember)

    const outcome = await handleApprovalCallback({
      provider: 'telegram',
      externalId: '42',
      requestId: 'req-1',
    })

    expect(outcome.messageHtml).toContain('قبلاً')
    expect(outcome.replacementKeyboard).toBeNull()
    expect(mocks.approveAppointmentRequest).not.toHaveBeenCalled()
  })

  it('forbids callers who are not managers of the request salon', async () => {
    mocks.findAccountByExternalId.mockResolvedValue(linkedAccount)
    mocks.getAppointmentRequestForCallback.mockResolvedValue(pendingRequest)
    mocks.getMemberForUser.mockResolvedValue({
      ...managerMember,
      organizationId: 'other-salon',
    })

    const outcome = await handleApprovalCallback({
      provider: 'telegram',
      externalId: '42',
      requestId: 'req-1',
    })

    expect(outcome.toast).toBe('دسترسی ندارید')
    expect(mocks.approveAppointmentRequest).not.toHaveBeenCalled()
  })

  it('returns not-linked when no messaging account exists', async () => {
    mocks.findAccountByExternalId.mockResolvedValue(undefined)
    const outcome = await handleApprovalCallback({
      provider: 'telegram',
      externalId: '42',
      requestId: 'req-1',
    })
    expect(outcome.toast).toBe('حساب متصل نیست')
  })

  it('translates a 409 from approveAppointmentRequest into a recoverable open-in-app message', async () => {
    mocks.findAccountByExternalId.mockResolvedValue(linkedAccount)
    mocks.getAppointmentRequestForCallback.mockResolvedValue(pendingRequest)
    mocks.getMemberForUser.mockResolvedValue(managerMember)
    mocks.findSoleCapableStaffUserId.mockResolvedValue('staff-99')
    mocks.approveAppointmentRequest.mockResolvedValue({
      ok: false,
      status: 409,
      error: 'slot taken',
    })

    const outcome = await handleApprovalCallback({
      provider: 'telegram',
      externalId: '42',
      requestId: 'req-1',
      publicAppBaseUrl: 'https://app.example',
    })

    expect(outcome.replacementKeyboard).not.toBeNull()
    expect(outcome.toast).toBe('تأیید ممکن نیست')
  })
})

describe('handleRejectionCallback', () => {
  it('rejects on the happy path', async () => {
    mocks.findAccountByExternalId.mockResolvedValue(linkedAccount)
    mocks.getAppointmentRequestForCallback.mockResolvedValue(pendingRequest)
    mocks.getMemberForUser.mockResolvedValue(managerMember)
    mocks.rejectAppointmentRequest.mockResolvedValue({ ok: true })

    const outcome = await handleRejectionCallback({
      provider: 'telegram',
      externalId: '42',
      requestId: 'req-1',
    })

    expect(mocks.rejectAppointmentRequest).toHaveBeenCalledWith({
      id: 'req-1',
      salonId: 'salon-1',
      reviewedByUserId: 'mgr-1',
      reason: 'rejected via Telegram',
    })
    expect(outcome.messageHtml).toContain('❌')
    expect(outcome.replacementKeyboard).toBeNull()
    expect(outcome.toast).toBe('رد شد')
  })

  it('reports a race-safe message when the request flipped concurrently', async () => {
    mocks.findAccountByExternalId.mockResolvedValue(linkedAccount)
    mocks.getAppointmentRequestForCallback.mockResolvedValue(pendingRequest)
    mocks.getMemberForUser.mockResolvedValue(managerMember)
    mocks.rejectAppointmentRequest.mockResolvedValue({
      ok: false,
      status: 409,
      error: 'not rejectable',
    })

    const outcome = await handleRejectionCallback({
      provider: 'telegram',
      externalId: '42',
      requestId: 'req-1',
    })

    expect(outcome.toast).toBe('رد ممکن نیست')
  })
})
