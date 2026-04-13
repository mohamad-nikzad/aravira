'use client'

import { addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CalendarView } from '@/lib/types'
import {
  formatPersianFullDate,
  formatPersianMonthYear,
  formatPersianWeekRange,
} from '@/lib/jalali-display'

interface CalendarHeaderProps {
  /** Visible period anchor from FullCalendar `datesSet` — used for the title only */
  titleAnchor: Date
  /** Date passed to `gotoDate` — must be used for prev/next so we do not add months to the grid’s leading cell */
  navigationDate: Date
  view: CalendarView
  onDateChange: (date: Date) => void
  onToday: () => void
  onAddAppointment: () => void
}

export function CalendarHeader({
  titleAnchor,
  navigationDate,
  view,
  onDateChange,
  onToday,
  onAddAppointment,
}: CalendarHeaderProps) {
  const navigate = (direction: 'prev' | 'next') => {
    const d = navigationDate
    switch (view) {
      case 'day':
        onDateChange(direction === 'prev' ? subDays(d, 1) : addDays(d, 1))
        break
      case 'week':
      case 'list':
        onDateChange(direction === 'prev' ? subWeeks(d, 1) : addWeeks(d, 1))
        break
      case 'month':
        onDateChange(direction === 'prev' ? subMonths(d, 1) : addMonths(d, 1))
        break
    }
  }

  const getTitle = () => {
    switch (view) {
      case 'day':
        return formatPersianFullDate(titleAnchor)
      case 'week':
      case 'list':
        return formatPersianWeekRange(titleAnchor, addDays(titleAnchor, 6))
      case 'month':
        // `titleAnchor` is the first cell of the grid (often previous Gregorian month); month label should match `gotoDate`
        return formatPersianMonthYear(navigationDate)
    }
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b bg-card px-4 py-3">
      {/* LTR: left = past, right = future — stable under page RTL so chevrons match behavior */}
      <div dir="ltr" className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('prev')} type="button">
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">قبلی</span>
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('next')} type="button">
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">بعدی</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onToday} className="hidden sm:flex" type="button">
          امروز
        </Button>
      </div>

      <h1 className="text-sm font-semibold text-foreground sm:text-base">
        {getTitle()}
      </h1>

      <Button size="sm" onClick={onAddAppointment} className="gap-1.5">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">نوبت جدید</span>
      </Button>
    </header>
  )
}
