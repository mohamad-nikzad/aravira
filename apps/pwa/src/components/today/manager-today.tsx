import { ManagerTodayProvider } from '#/components/today/manager-today-provider'
import { ManagerTodayScreen } from '#/components/today/manager-today-screen'

export function ManagerToday({ userName }: { userName: string }) {
  return (
    <ManagerTodayProvider userName={userName}>
      <ManagerTodayScreen />
    </ManagerTodayProvider>
  )
}
