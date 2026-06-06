import { useMemo } from 'react'
import type { User } from '@repo/salon-core/types'
import { normalizeCalendarColorId } from '@repo/salon-core/calendar-colors'
import { Users } from 'lucide-react'
import { CalendarDrawerFilter } from './calendar-drawer-filter'

interface StaffFilterProps {
  staff: User[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function StaffFilter({
  staff,
  selectedIds,
  onChange,
}: StaffFilterProps) {
  const options = useMemo(
    () =>
      staff.map((member) => ({
        id: member.id,
        label: member.name,
        marker: getInitials(member.name),
        colorVar: `var(--calendar-${normalizeCalendarColorId(member.color)})`,
        searchText: member.name,
      })),
    [staff],
  )

  return (
    <CalendarDrawerFilter
      ariaLabel="فیلتر پرسنل"
      triggerLabel="پرسنل"
      title="انتخاب پرسنل"
      description="پرسنل مورد نظر را جستجو و برای فیلتر کردن تقویم انتخاب کنید."
      searchPlaceholder="جستجو بین پرسنل…"
      allLabel="همه پرسنل"
      allDescription="نمایش نوبت‌های همه اعضا"
      allMarker="ه"
      emptyText="پرسنلی با این جستجو پیدا نشد"
      icon={Users}
      options={options}
      selectedIds={selectedIds}
      onChange={onChange}
    />
  )
}
