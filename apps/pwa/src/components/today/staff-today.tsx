import { StaffTodayProvider } from '#/components/today/staff-today-provider'
import { StaffTodayScreen } from '#/components/today/staff-today-screen'

export function StaffToday({
  userName,
  enabled,
}: {
  userName: string
  enabled: boolean
}) {
  return (
    <StaffTodayProvider userName={userName} enabled={enabled}>
      <StaffTodayScreen />
    </StaffTodayProvider>
  )
}
