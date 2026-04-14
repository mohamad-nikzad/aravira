'use client'

import { addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CalendarView } from '@/lib/types'
import {
  formatPersianFullDate,
  formatPersianMonthYear,
  formatPersianWeekRange,
} from '@/lib/jalali-display'

interface CalendarHeaderProps {
  titleAnchor: Date
  navigationDate: Date
  view: CalendarView
  onDateChange: (date: Date) => void
  onToday: () => void
}

export function CalendarHeader({
  titleAnchor,
  navigationDate,
  view,
  onDateChange,
  onToday,
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
        return formatPersianMonthYear(navigationDate)
    }
  }

  return (
    <header className="calendar-header-gradient flex items-center gap-2 px-3 py-2 sm:px-4">
      <div className="flex items-center gap-0.5 shrink-0">
        <span className="text-base font-bold text-primary tracking-tight ml-1.5">آراویرا</span>
      </div>

      <div className="flex-1 min-w-0 text-center">
        <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
          {getTitle()}
        </p>
      </div>

      <div dir="ltr" className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate('prev')}
          type="button"
          className="h-8 w-8 touch-manipulation"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">قبلی</span>
        </Button>
        <button
          onClick={onToday}
          className="px-2 py-1 text-xs font-semibold text-primary touch-manipulation rounded-md hover:bg-primary/8 transition-colors"
          type="button"
        >
          امروز
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate('next')}
          type="button"
          className="h-8 w-8 touch-manipulation"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">بعدی</span>
        </Button>
      </div>
    </header>
  )
}
