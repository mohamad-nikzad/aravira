import fs from 'node:fs'
import path from 'node:path'
import { User, Service, Client, Appointment } from './types'
import bcrypt from 'bcryptjs'

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_FILE = path.join(DATA_DIR, 'salon-db.json')

interface Store {
  users: Map<string, User & { password: string }>
  services: Map<string, Service>
  clients: Map<string, Client>
  appointments: Map<string, Appointment>
  initialized: boolean
}

const store: Store = {
  users: new Map(),
  services: new Map(),
  clients: new Map(),
  appointments: new Map(),
  initialized: false,
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

interface PersistedDb {
  users: (User & { password: string })[]
  services: Service[]
  clients: Client[]
  appointments: Appointment[]
}

function persistStore() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    const data: PersistedDb = {
      users: Array.from(store.users.values()),
      services: Array.from(store.services.values()),
      clients: Array.from(store.clients.values()),
      appointments: Array.from(store.appointments.values()),
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to persist salon db:', e)
  }
}

function loadFromDisk(): boolean {
  try {
    if (!fs.existsSync(DB_FILE)) return false
    const raw = fs.readFileSync(DB_FILE, 'utf-8')
    const data = JSON.parse(raw) as PersistedDb
    if (
      !data?.users ||
      !Array.isArray(data.users) ||
      data.users.length === 0 ||
      !Array.isArray(data.services) ||
      !Array.isArray(data.clients) ||
      !Array.isArray(data.appointments)
    ) {
      return false
    }

    store.users.clear()
    store.services.clear()
    store.clients.clear()
    store.appointments.clear()

    for (const u of data.users) {
      store.users.set(u.id, {
        ...u,
        email: normalizeEmail(u.email),
        createdAt: new Date(u.createdAt as unknown as string),
      })
    }
    for (const s of data.services) {
      store.services.set(s.id, s)
    }
    for (const c of data.clients) {
      store.clients.set(c.id, {
        ...c,
        createdAt: new Date(c.createdAt as unknown as string),
      })
    }
    for (const a of data.appointments) {
      store.appointments.set(a.id, {
        ...a,
        createdAt: new Date(a.createdAt as unknown as string),
        updatedAt: new Date(a.updatedAt as unknown as string),
      })
    }

    return true
  } catch {
    return false
  }
}

function seedDefaults() {
  const hashedPassword = bcrypt.hashSync('admin123', 10)

  const users: (User & { password: string })[] = [
    { id: 'u1', email: 'manager@salon.com', password: hashedPassword, name: 'سارا محمدی', role: 'manager', color: 'bg-staff-1', createdAt: new Date() },
    { id: 'u2', email: 'emma@salon.com', password: hashedPassword, name: 'مریم احمدی', role: 'staff', color: 'bg-staff-2', createdAt: new Date() },
    { id: 'u3', email: 'lisa@salon.com', password: hashedPassword, name: 'فاطمه رضایی', role: 'staff', color: 'bg-staff-3', createdAt: new Date() },
    { id: 'u4', email: 'nina@salon.com', password: hashedPassword, name: 'نینا فرهادی', role: 'staff', color: 'bg-staff-4', createdAt: new Date() },
  ]

  for (const u of users) {
    store.users.set(u.id, { ...u, email: normalizeEmail(u.email) })
  }

  const services: Service[] = [
    { id: 's1', name: 'کوتاهی مو', category: 'hair', duration: 45, price: 500000, color: 'bg-staff-1', active: true },
    { id: 's2', name: 'رنگ مو', category: 'hair', duration: 120, price: 1500000, color: 'bg-staff-1', active: true },
    { id: 's3', name: 'براشینگ', category: 'hair', duration: 30, price: 350000, color: 'bg-staff-1', active: true },
    { id: 's4', name: 'مانیکور', category: 'nails', duration: 30, price: 300000, color: 'bg-staff-2', active: true },
    { id: 's5', name: 'پدیکور', category: 'nails', duration: 45, price: 450000, color: 'bg-staff-2', active: true },
    { id: 's6', name: 'کاشت ناخن', category: 'nails', duration: 60, price: 550000, color: 'bg-staff-2', active: true },
    { id: 's7', name: 'پاکسازی صورت', category: 'skincare', duration: 60, price: 800000, color: 'bg-staff-3', active: true },
    { id: 's8', name: 'میکرودرم', category: 'skincare', duration: 45, price: 1000000, color: 'bg-staff-3', active: true },
    { id: 's9', name: 'ماساژ سوئدی', category: 'spa', duration: 60, price: 900000, color: 'bg-staff-4', active: true },
    { id: 's10', name: 'ماساژ عمقی', category: 'spa', duration: 90, price: 1200000, color: 'bg-staff-4', active: true },
  ]

  for (const s of services) {
    store.services.set(s.id, s)
  }

  const clients: Client[] = [
    { id: 'c1', name: 'زهرا کریمی', phone: '۰۹۱۲۱۲۳۴۵۶۷', email: 'zahra@email.com', createdAt: new Date() },
    { id: 'c2', name: 'نازنین حسینی', phone: '۰۹۱۲۲۳۴۵۶۷۸', email: 'nazanin@email.com', createdAt: new Date() },
    { id: 'c3', name: 'مهسا علیزاده', phone: '۰۹۱۲۳۴۵۶۷۸۹', email: 'mahsa@email.com', createdAt: new Date() },
    { id: 'c4', name: 'سمیرا باقری', phone: '۰۹۱۲۴۵۶۷۸۹۰', createdAt: new Date() },
    { id: 'c5', name: 'الهام نوری', phone: '۰۹۱۲۵۶۷۸۹۰۱', email: 'elham@email.com', createdAt: new Date() },
    { id: 'c6', name: 'شیما رستمی', phone: '۰۹۱۲۶۷۸۹۰۱۲', email: 'shima@email.com', createdAt: new Date() },
    { id: 'c7', name: 'پریسا مرادی', phone: '۰۹۱۲۷۸۹۰۱۲۳', createdAt: new Date() },
    { id: 'c8', name: 'مینا صادقی', phone: '۰۹۱۲۸۹۰۱۲۳۴', email: 'mina@email.com', createdAt: new Date() },
    { id: 'c9', name: 'لیلا قاسمی', phone: '۰۹۱۲۹۰۱۲۳۴۵', createdAt: new Date() },
    { id: 'c10', name: 'سودابه امینی', phone: '۰۹۱۳۰۱۲۳۴۵۶', email: 'soudabeh@email.com', notes: 'حساسیت به رنگ', createdAt: new Date() },
    { id: 'c11', name: 'نگار طاهری', phone: '۰۹۱۳۱۲۳۴۵۶۷', createdAt: new Date() },
    { id: 'c12', name: 'آرزو مهدوی', phone: '۰۹۱۳۲۳۴۵۶۷۸', email: 'arzoo@email.com', createdAt: new Date() },
  ]

  for (const c of clients) {
    store.clients.set(c.id, c)
  }

  const today = new Date()
  const formatDate = (d: Date) => d.toISOString().split('T')[0]
  const dayOffset = (offsetDays: number) =>
    formatDate(new Date(today.getTime() + offsetDays * 86400000))

  const now = new Date()
  const appointments: Appointment[] = [
    // ——— امروز (چند پرسنل، چند بازه) ———
    {
      id: 'a1',
      clientId: 'c1',
      staffId: 'u1',
      serviceId: 's1',
      date: dayOffset(0),
      startTime: '09:00',
      endTime: '09:45',
      status: 'confirmed',
      notes: 'کوتاهی کوتاه‌تر از معمول',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a2',
      clientId: 'c2',
      staffId: 'u2',
      serviceId: 's4',
      date: dayOffset(0),
      startTime: '09:30',
      endTime: '10:00',
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a3',
      clientId: 'c3',
      staffId: 'u1',
      serviceId: 's7',
      date: dayOffset(0),
      startTime: '10:30',
      endTime: '11:30',
      status: 'confirmed',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a4',
      clientId: 'c6',
      staffId: 'u1',
      serviceId: 's1',
      date: dayOffset(0),
      startTime: '12:00',
      endTime: '12:30',
      status: 'scheduled',
      notes: 'همان خدمت s1 با مدت ۳۰ دقیقه',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a5',
      clientId: 'c4',
      staffId: 'u3',
      serviceId: 's9',
      date: dayOffset(0),
      startTime: '10:00',
      endTime: '11:00',
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a6',
      clientId: 'c5',
      staffId: 'u2',
      serviceId: 's6',
      date: dayOffset(0),
      startTime: '11:00',
      endTime: '12:00',
      status: 'confirmed',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a7',
      clientId: 'c7',
      staffId: 'u3',
      serviceId: 's3',
      date: dayOffset(0),
      startTime: '13:00',
      endTime: '13:30',
      status: 'completed',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a8',
      clientId: 'c8',
      staffId: 'u4',
      serviceId: 's10',
      date: dayOffset(0),
      startTime: '14:00',
      endTime: '15:45',
      status: 'confirmed',
      notes: 'ماساژ عمقی ۱۰۵ دقیقه (متفاوت از پیش‌فرض خدمت)',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a9',
      clientId: 'c9',
      staffId: 'u2',
      serviceId: 's5',
      date: dayOffset(0),
      startTime: '15:00',
      endTime: '16:00',
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a10',
      clientId: 'c10',
      staffId: 'u1',
      serviceId: 's2',
      date: dayOffset(0),
      startTime: '16:00',
      endTime: '18:30',
      status: 'scheduled',
      notes: 'رنگ ریشه + کل سر',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a11',
      clientId: 'c11',
      staffId: 'u4',
      serviceId: 's8',
      date: dayOffset(0),
      startTime: '16:30',
      endTime: '17:15',
      status: 'confirmed',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a12',
      clientId: 'c12',
      staffId: 'u3',
      serviceId: 's4',
      date: dayOffset(0),
      startTime: '17:00',
      endTime: '17:30',
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
    // ——— دیروز ———
    {
      id: 'a13',
      clientId: 'c1',
      staffId: 'u2',
      serviceId: 's4',
      date: dayOffset(-1),
      startTime: '10:00',
      endTime: '10:30',
      status: 'completed',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a14',
      clientId: 'c3',
      staffId: 'u1',
      serviceId: 's1',
      date: dayOffset(-1),
      startTime: '11:00',
      endTime: '12:15',
      status: 'completed',
      notes: '۹۰ دقیقه برای همان کوتاهی',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a15',
      clientId: 'c6',
      staffId: 'u4',
      serviceId: 's9',
      date: dayOffset(-1),
      startTime: '15:00',
      endTime: '16:00',
      status: 'cancelled',
      createdAt: now,
      updatedAt: now,
    },
    // ——— فردا ———
    {
      id: 'a16',
      clientId: 'c1',
      staffId: 'u3',
      serviceId: 's2',
      date: dayOffset(1),
      startTime: '09:00',
      endTime: '11:00',
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a17',
      clientId: 'c3',
      staffId: 'u2',
      serviceId: 's5',
      date: dayOffset(1),
      startTime: '13:00',
      endTime: '13:45',
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a18',
      clientId: 'c4',
      staffId: 'u1',
      serviceId: 's7',
      date: dayOffset(1),
      startTime: '14:30',
      endTime: '15:45',
      status: 'confirmed',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a19',
      clientId: 'c8',
      staffId: 'u4',
      serviceId: 's10',
      date: dayOffset(1),
      startTime: '16:00',
      endTime: '17:30',
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
    // ——— +۲ تا +۵ روز ———
    {
      id: 'a20',
      clientId: 'c2',
      staffId: 'u1',
      serviceId: 's3',
      date: dayOffset(2),
      startTime: '09:30',
      endTime: '10:00',
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a21',
      clientId: 'c5',
      staffId: 'u2',
      serviceId: 's6',
      date: dayOffset(2),
      startTime: '11:00',
      endTime: '12:00',
      status: 'confirmed',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a22',
      clientId: 'c7',
      staffId: 'u3',
      serviceId: 's8',
      date: dayOffset(3),
      startTime: '10:00',
      endTime: '10:45',
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a23',
      clientId: 'c9',
      staffId: 'u1',
      serviceId: 's2',
      date: dayOffset(3),
      startTime: '13:00',
      endTime: '15:00',
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a24',
      clientId: 'c10',
      staffId: 'u4',
      serviceId: 's9',
      date: dayOffset(4),
      startTime: '11:30',
      endTime: '12:30',
      status: 'confirmed',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a25',
      clientId: 'c11',
      staffId: 'u2',
      serviceId: 's4',
      date: dayOffset(4),
      startTime: '14:00',
      endTime: '14:30',
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a26',
      clientId: 'c12',
      staffId: 'u3',
      serviceId: 's5',
      date: dayOffset(5),
      startTime: '09:00',
      endTime: '10:00',
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a27',
      clientId: 'c6',
      staffId: 'u1',
      serviceId: 's1',
      date: dayOffset(5),
      startTime: '15:00',
      endTime: '15:20',
      status: 'no-show',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a28',
      clientId: 'c4',
      staffId: 'u4',
      serviceId: 's7',
      date: dayOffset(6),
      startTime: '12:00',
      endTime: '13:15',
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a29',
      clientId: 'c2',
      staffId: 'u2',
      serviceId: 's5',
      date: dayOffset(6),
      startTime: '16:00',
      endTime: '16:45',
      status: 'confirmed',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'a30',
      clientId: 'c8',
      staffId: 'u1',
      serviceId: 's3',
      date: dayOffset(7),
      startTime: '10:00',
      endTime: '10:30',
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
  ]

  for (const apt of appointments) {
    store.appointments.set(apt.id, apt)
  }
}

function initializeStore() {
  if (store.initialized) return

  if (loadFromDisk()) {
    store.initialized = true
    return
  }

  seedDefaults()
  store.initialized = true
  persistStore()
}

initializeStore()

export function getUserByEmail(email: string): (User & { password: string }) | undefined {
  initializeStore()
  const normalized = normalizeEmail(email)
  for (const user of store.users.values()) {
    if (normalizeEmail(user.email) === normalized) return user
  }
  return undefined
}

export function getUserById(id: string): User | undefined {
  initializeStore()
  const user = store.users.get(id)
  if (!user) return undefined
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

export function getAllStaff(): User[] {
  initializeStore()
  const users: User[] = []
  for (const user of store.users.values()) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user
    users.push(userWithoutPassword)
  }
  return users.sort((a, b) => a.name.localeCompare(b.name, 'fa'))
}

export function createUser(user: Omit<User, 'id' | 'createdAt'> & { password: string }): User {
  initializeStore()
  const id = `u${Date.now()}`
  const hashedPassword = bcrypt.hashSync(user.password, 10)

  const newUser: User & { password: string } = {
    id,
    email: normalizeEmail(user.email),
    password: hashedPassword,
    name: user.name,
    role: user.role,
    color: user.color,
    phone: user.phone,
    createdAt: new Date(),
  }

  store.users.set(id, newUser)
  persistStore()
  return getUserById(id)!
}

export function getAllServices(): Service[] {
  initializeStore()
  return Array.from(store.services.values())
    .filter((s) => s.active)
    .sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category)
      return a.name.localeCompare(b.name, 'fa')
    })
}

export function getServiceById(id: string): Service | undefined {
  initializeStore()
  return store.services.get(id)
}

export function getAllClients(): Client[] {
  initializeStore()
  return Array.from(store.clients.values()).sort((a, b) => a.name.localeCompare(b.name, 'fa'))
}

export function getClientById(id: string): Client | undefined {
  initializeStore()
  return store.clients.get(id)
}

export function createClient(client: Omit<Client, 'id' | 'createdAt'>): Client {
  initializeStore()
  const id = `c${Date.now()}`

  const newClient: Client = {
    id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    notes: client.notes,
    createdAt: new Date(),
  }

  store.clients.set(id, newClient)
  persistStore()
  return newClient
}

export function updateClient(id: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>): Client | undefined {
  initializeStore()
  const existing = store.clients.get(id)
  if (!existing) return undefined

  const updated = { ...existing, ...data }
  store.clients.set(id, updated)
  persistStore()
  return updated
}

export function getAppointmentsByDate(date: string): Appointment[] {
  initializeStore()
  return Array.from(store.appointments.values())
    .filter((apt) => apt.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

export function getAppointmentsByDateRange(startDate: string, endDate: string): Appointment[] {
  initializeStore()
  return Array.from(store.appointments.values())
    .filter((apt) => apt.date >= startDate && apt.date <= endDate)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.startTime.localeCompare(b.startTime)
    })
}

export function getAppointmentById(id: string): Appointment | undefined {
  initializeStore()
  return store.appointments.get(id)
}

export function createAppointment(apt: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Appointment {
  initializeStore()
  const id = `a${Date.now()}`

  const newApt: Appointment = {
    id,
    clientId: apt.clientId,
    staffId: apt.staffId,
    serviceId: apt.serviceId,
    date: apt.date,
    startTime: apt.startTime,
    endTime: apt.endTime,
    status: apt.status,
    notes: apt.notes,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  store.appointments.set(id, newApt)
  persistStore()
  return newApt
}

export function updateAppointment(
  id: string,
  data: Partial<Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>>
): Appointment | undefined {
  initializeStore()
  const existing = store.appointments.get(id)
  if (!existing) return undefined

  const updated = { ...existing, ...data, updatedAt: new Date() }
  store.appointments.set(id, updated)
  persistStore()
  return updated
}

export function deleteAppointment(id: string): boolean {
  initializeStore()
  const ok = store.appointments.delete(id)
  if (ok) persistStore()
  return ok
}

export function hasConflict(
  staffId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string
): boolean {
  initializeStore()

  for (const apt of store.appointments.values()) {
    if (apt.staffId !== staffId || apt.date !== date || apt.status === 'cancelled') continue
    if (excludeId && apt.id === excludeId) continue

    if (
      (apt.startTime < endTime && apt.endTime > startTime) ||
      (startTime < apt.endTime && endTime > apt.startTime) ||
      (apt.startTime >= startTime && apt.endTime <= endTime)
    ) {
      return true
    }
  }

  return false
}
