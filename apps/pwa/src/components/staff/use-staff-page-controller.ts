import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { User } from '@repo/salon-core/types'

import { api } from '#/lib/api-client'
import { useManagerDataClient } from '#/lib/manager-data-client'
import { staffScheduleBundleQueryKey } from '#/lib/query-keys'
import { useManagerWriteMutation } from '#/lib/use-manager-mutation'

type StaffPageControllerOptions = {
  onDeleteSuccess?: (staff: User) => void
}

export function useStaffPageController(options: StaffPageControllerOptions = {}) {
  const { onDeleteSuccess } = options
  const dc = useManagerDataClient()
  const queryClient = useQueryClient()

  const [profileOpen, setProfileOpen] = useState(false)
  const [profileStaff, setProfileStaff] = useState<User | null>(null)
  const [passwordStaff, setPasswordStaff] = useState<User | null>(null)
  const [servicesStaff, setServicesStaff] = useState<User | null>(null)
  const [scheduleStaff, setScheduleStaff] = useState<User | null>(null)
  const [deletingStaff, setDeletingStaff] = useState<User | null>(null)

  const refreshRoster = useCallback(() => {
    void dc?.staff.refresh()
  }, [dc])

  const refreshSchedule = useCallback(
    (staffId: string) => {
      void queryClient.invalidateQueries({
        queryKey: staffScheduleBundleQueryKey(staffId),
      })
    },
    [queryClient],
  )

  const deleteStaff = useManagerWriteMutation('staff.delete', {
    apiFn: async (member: User) => {
      await api.staff.delete(member.id)
    },
    meta: { errorMessage: 'حذف پرسنل انجام نشد' },
    onSuccess: (_data, member) => {
      setDeletingStaff(null)
      refreshRoster()
      onDeleteSuccess?.(member)
    },
  })

  const openCreateProfile = useCallback(() => {
    setProfileStaff(null)
    setProfileOpen(true)
  }, [])

  const openEditProfile = useCallback((member: User) => {
    setProfileStaff(member)
    setProfileOpen(true)
  }, [])

  const handleProfileSuccess = useCallback(() => {
    setProfileOpen(false)
    setProfileStaff(null)
    refreshRoster()
  }, [refreshRoster])

  const openPassword = useCallback((member: User) => {
    setPasswordStaff(member)
  }, [])

  const handlePasswordSuccess = useCallback(() => {
    setPasswordStaff(null)
  }, [])

  const openServices = useCallback((member: User) => {
    setServicesStaff(member)
  }, [])

  const handleServicesSuccess = useCallback(() => {
    setServicesStaff(null)
  }, [])

  const openSchedule = useCallback((member: User) => {
    setScheduleStaff(member)
  }, [])

  const handleScheduleSuccess = useCallback(() => {
    if (scheduleStaff) {
      refreshSchedule(scheduleStaff.id)
    }
    setScheduleStaff(null)
  }, [refreshSchedule, scheduleStaff])

  const openDeleteDialog = useCallback((member: User) => {
    setDeletingStaff(member)
  }, [])

  const confirmDelete = useCallback(() => {
    if (!deletingStaff) return
    deleteStaff.mutate(deletingStaff)
  }, [deleteStaff, deletingStaff])

  return {
    profileOpen,
    profileStaff,
    openCreateProfile,
    openEditProfile,
    setProfileOpen,
    setProfileStaff,
    handleProfileSuccess,
    passwordStaff,
    openPassword,
    setPasswordStaff,
    handlePasswordSuccess,
    servicesStaff,
    openServices,
    setServicesStaff,
    handleServicesSuccess,
    scheduleStaff,
    openSchedule,
    setScheduleStaff,
    handleScheduleSuccess,
    deletingStaff,
    openDeleteDialog,
    setDeletingStaff,
    deleteStaffIsPending: deleteStaff.isPending,
    confirmDelete,
    refreshRoster,
    refreshSchedule,
  }
}
