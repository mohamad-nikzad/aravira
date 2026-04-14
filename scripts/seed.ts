/**
 * Fresh DB seed. Run after schema exists:
 *   bun run db:push
 *   bun run db:seed
 */
import bcrypt from 'bcryptjs'
import { drizzle } from 'drizzle-orm/postgres-js'
import { count, eq } from 'drizzle-orm'
import postgres from 'postgres'
import { getDatabaseUrl } from '../db/config'
import * as schema from '../db/schema'
import { appointments, businessSettings, clients, services, users } from '../db/schema'

const client = postgres(getDatabaseUrl({ preferDirect: true }), { max: 1 })
const db = drizzle(client, { schema })

const passwordHash = bcrypt.hashSync('admin123', 10)

function formatDate(d: Date) {
  return d.toISOString().split('T')[0]
}

async function main() {
  // Repair early local seeds that were inserted without the leading zero.
  await db.update(users).set({ phone: '09120000000' }).where(eq(users.phone, '9120000000'))
  await db.update(users).set({ phone: '09120000001' }).where(eq(users.phone, '9120000001'))
  await db.update(users).set({ phone: '09120000002' }).where(eq(users.phone, '9120000002'))

  await db
    .insert(businessSettings)
    .values({
      id: 1,
      workingStart: '09:00',
      workingEnd: '19:00',
      slotDurationMinutes: 30,
    })
    .onConflictDoUpdate({
      target: businessSettings.id,
      set: {
        workingStart: '09:00',
        workingEnd: '19:00',
        slotDurationMinutes: 30,
      },
    })

  const serviceRows = [
    {
      name: 'کوتاهی مو',
      category: 'hair' as const,
      duration: 45,
      price: 500_000,
      color: 'bg-staff-1',
      active: true,
    },
    {
      name: 'رنگ مو',
      category: 'hair' as const,
      duration: 120,
      price: 1_500_000,
      color: 'bg-staff-1',
      active: true,
    },
    {
      name: 'مانیکور',
      category: 'nails' as const,
      duration: 30,
      price: 300_000,
      color: 'bg-staff-2',
      active: true,
    },
    {
      name: 'پاکسازی صورت',
      category: 'skincare' as const,
      duration: 60,
      price: 800_000,
      color: 'bg-staff-3',
      active: true,
    },
    {
      name: 'ماساژ سوئدی',
      category: 'spa' as const,
      duration: 60,
      price: 900_000,
      color: 'bg-staff-4',
      active: true,
    },
  ]

  const [{ value: serviceCount }] = await db.select({ value: count() }).from(services)
  if (serviceCount === 0) {
    await db.insert(services).values(serviceRows)
  }

  const [{ value: userCount }] = await db.select({ value: count() }).from(users)
  if (userCount === 0) {
    await db.insert(users).values([
      {
        name: 'مدیر سالن',
        phone: '09120000000',
        passwordHash,
        role: 'manager',
        color: 'bg-staff-1',
        active: true,
      },
      {
        name: 'مریم احمدی',
        phone: '09120000001',
        passwordHash,
        role: 'staff',
        color: 'bg-staff-2',
        active: true,
      },
      {
        name: 'فاطمه رضایی',
        phone: '09120000002',
        passwordHash,
        role: 'staff',
        color: 'bg-staff-3',
        active: true,
      },
    ])
  }

  const clientRows = [
    { name: 'زهرا کریمی', phone: '09121234567', notes: 'مشتری ثابت' },
    { name: 'نازنین حسینی', phone: '09122345678', notes: null },
    { name: 'مهسا علیزاده', phone: '09123456789', notes: 'ترجیح می‌دهد عصر مراجعه کند' },
    { name: 'سمیرا باقری', phone: '09124567890', notes: null },
    { name: 'الهام نوری', phone: '09125678901', notes: 'حساسیت به رنگ' },
  ]

  const [{ value: clientCount }] = await db.select({ value: count() }).from(clients)
  if (clientCount === 0) {
    await db.insert(clients).values(clientRows)
  }

  const allUsers = await db.select().from(users)
  const allServices = await db.select().from(services)
  const allClients = await db.select().from(clients)

  const manager = allUsers.find((u) => u.role === 'manager')
  const staffA = allUsers.find((u) => u.phone === '09120000001')
  const staffB = allUsers.find((u) => u.phone === '09120000002')

  const hairService = allServices.find((s) => s.name === 'کوتاهی مو')
  const colorService = allServices.find((s) => s.name === 'رنگ مو')
  const manicureService = allServices.find((s) => s.name === 'مانیکور')
  const skincareService = allServices.find((s) => s.name === 'پاکسازی صورت')

  const today = new Date()
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

  const [{ value: appointmentCount }] = await db.select({ value: count() }).from(appointments)
  if (
    appointmentCount === 0 &&
    manager &&
    staffA &&
    staffB &&
    hairService &&
    colorService &&
    manicureService &&
    skincareService &&
    allClients.length >= 4
  ) {
    await db.insert(appointments).values([
      {
        clientId: allClients[0].id,
        staffId: staffA.id,
        serviceId: hairService.id,
        date: formatDate(today),
        startTime: '09:00',
        endTime: '09:45',
        status: 'confirmed',
        notes: 'کوتاهی کلاسیک',
        createdByUserId: manager.id,
      },
      {
        clientId: allClients[1].id,
        staffId: staffB.id,
        serviceId: manicureService.id,
        date: formatDate(today),
        startTime: '10:00',
        endTime: '10:30',
        status: 'scheduled',
        notes: null,
        createdByUserId: manager.id,
      },
      {
        clientId: allClients[2].id,
        staffId: staffA.id,
        serviceId: colorService.id,
        date: formatDate(today),
        startTime: '14:00',
        endTime: '16:00',
        status: 'scheduled',
        notes: 'رنگ کامل',
        createdByUserId: manager.id,
      },
      {
        clientId: allClients[3].id,
        staffId: staffB.id,
        serviceId: skincareService.id,
        date: formatDate(tomorrow),
        startTime: '11:00',
        endTime: '12:00',
        status: 'confirmed',
        notes: null,
        createdByUserId: manager.id,
      },
    ])
  }

  console.log('Seed complete.')
  console.log('Manager: 09120000000 / admin123')
  console.log('Staff: 09120000001, 09120000002 / admin123')
  await client.end()
}

main().catch(async (e) => {
  console.error(e)
  await client.end({ timeout: 1 })
  process.exit(1)
})
