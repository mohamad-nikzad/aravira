import type { ColorToken } from './colors'

const tok = (oklch: string, hex: string): ColorToken => ({ oklch, hex })

export type CalendarColorId = 'rose' | 'violet' | 'mint' | 'gold' | 'coral'

export type CalendarColorOption = {
  readonly id: CalendarColorId
  readonly labelFa: string
  readonly light: ColorToken
  readonly dark: ColorToken
}

export const calendarColorOptions = [
  {
    id: 'rose',
    labelFa: 'رز',
    light: tok('oklch(0.597 0.126 10)', '#C26878'),
    dark: tok('oklch(0.597 0.126 10)', '#C26878'),
  },
  {
    id: 'violet',
    labelFa: 'بنفش',
    light: tok('oklch(0.65 0.09 270)', '#8A8AC4'),
    dark: tok('oklch(0.55 0.07 270)', '#7373A6'),
  },
  {
    id: 'mint',
    labelFa: 'نعنایی',
    light: tok('oklch(0.67 0.09 170)', '#62B3A4'),
    dark: tok('oklch(0.57 0.07 170)', '#4F9287'),
  },
  {
    id: 'gold',
    labelFa: 'طلایی',
    light: tok('oklch(0.7 0.1 80)', '#C7A75B'),
    dark: tok('oklch(0.6 0.08 80)', '#A68A47'),
  },
  {
    id: 'coral',
    labelFa: 'مرجانی',
    light: tok('oklch(0.65 0.11 35)', '#C57A55'),
    dark: tok('oklch(0.55 0.09 35)', '#A66245'),
  },
] as const satisfies readonly CalendarColorOption[]

export const calendarColorIds = calendarColorOptions.map((option) => option.id)

export const calendarColorById = Object.fromEntries(
  calendarColorOptions.map((option) => [option.id, option])
) as Record<CalendarColorId, CalendarColorOption>

