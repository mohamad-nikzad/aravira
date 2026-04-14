export type UserRole = 'manager' | 'staff'

export interface User {
  id: string
  name: string
  role: UserRole
  color: string
  phone: string
  createdAt: Date
}

export interface Service {
  id: string
  name: string
  category: 'hair' | 'nails' | 'skincare' | 'spa'
  duration: number // in minutes
  price: number
  color: string
  active: boolean
}

export interface Client {
  id: string
  name: string
  phone: string
  notes?: string
  createdAt: Date
}

export interface Appointment {
  id: string
  clientId: string
  staffId: string
  serviceId: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface AppointmentWithDetails extends Appointment {
  client: Client
  staff: User
  service: Service
}

export type CalendarView = 'day' | 'week' | 'month' | 'list'

export interface TimeSlot {
  time: string // HH:MM
  available: boolean
}

/** Default fallback when DB business_settings row is missing */
export const WORKING_HOURS = {
  start: '09:00',
  end: '19:00',
  slotDuration: 30, // minutes
} as const

export interface BusinessHours {
  workingStart: string
  workingEnd: string
  slotDurationMinutes: number
}

export const SERVICE_CATEGORIES = {
  hair: { label: 'مو', color: 'bg-staff-1' },
  nails: { label: 'ناخن', color: 'bg-staff-2' },
  skincare: { label: 'پوست', color: 'bg-staff-3' },
  spa: { label: 'اسپا', color: 'bg-staff-4' },
} as const

export const STAFF_COLORS = [
  'bg-staff-1',
  'bg-staff-2',
  'bg-staff-3',
  'bg-staff-4',
  'bg-staff-5',
] as const

export const APPOINTMENT_STATUS = {
  scheduled: { label: 'در انتظار', color: 'bg-muted text-muted-foreground' },
  confirmed: { label: 'تایید شده', color: 'bg-primary/20 text-primary' },
  completed: { label: 'انجام شده', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'لغو شده', color: 'bg-destructive/20 text-destructive' },
  'no-show': { label: 'غیبت', color: 'bg-orange-100 text-orange-700' },
} as const
