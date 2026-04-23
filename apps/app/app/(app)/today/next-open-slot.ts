type TimeRange = { startTime: string; endTime: string }

export type NextOpenSlot = {
  dayLabel: 'امروز' | 'فردا'
  startTime: string
  endTime: string
  startsNow: boolean
  additionalRanges: number
}

function findFirstUpcomingRange(ranges: TimeRange[], clockHm: string) {
  for (const [index, range] of ranges.entries()) {
    if (range.endTime <= clockHm) continue
    return { index, range }
  }

  return null
}

export function getNextOpenSlot(params: {
  todayRanges: TimeRange[]
  tomorrowRanges: TimeRange[]
  clockHm: string
}): NextOpenSlot | null {
  const todayMatch = findFirstUpcomingRange(params.todayRanges, params.clockHm)
  if (todayMatch) {
    return {
      dayLabel: 'امروز',
      startTime:
        todayMatch.range.startTime <= params.clockHm ? params.clockHm : todayMatch.range.startTime,
      endTime: todayMatch.range.endTime,
      startsNow: todayMatch.range.startTime <= params.clockHm,
      additionalRanges: params.todayRanges.length - todayMatch.index - 1,
    }
  }

  const tomorrowMatch = params.tomorrowRanges[0]
  if (!tomorrowMatch) {
    return null
  }

  return {
    dayLabel: 'فردا',
    startTime: tomorrowMatch.startTime,
    endTime: tomorrowMatch.endTime,
    startsNow: false,
    additionalRanges: params.tomorrowRanges.length - 1,
  }
}
