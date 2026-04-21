/**
 * Fresh DB seed. Run after schema exists:
 *   pnpm db:push
 *   pnpm db:seed
 */
import bcrypt from 'bcryptjs'
import { drizzle } from 'drizzle-orm/postgres-js'
import { and, asc, count, eq, inArray, like } from 'drizzle-orm'
import postgres from 'postgres'
import { getDatabaseUrl } from './config'
import * as schema from './schema'
import {
  appointments,
  businessSettings,
  clientFollowUps,
  clientTags,
  clients,
  locations,
  resources,
  salons,
  services,
  staffSchedules,
  staffServices,
  users,
} from './schema'

const client = postgres(getDatabaseUrl({ preferDirect: true }), { max: 1 })
const db = drizzle(client, { schema })

const passwordHash = bcrypt.hashSync('admin123', 10)

function formatDate(d: Date) {
  return d.toISOString().split('T')[0]
}

function salonYmdTehran(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tehran' })
}

function addDaysYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  dt.setUTCDate(dt.getUTCDate() + deltaDays)
  return dt.toISOString().slice(0, 10)
}

function currentHmTehran(): string {
  return new Date().toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Tehran',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}

function minutesToHm(total: number): string {
  let n = total % (24 * 60)
  if (n < 0) n += 24 * 60
  const h = Math.floor(n / 60)
  const min = n % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

const tagColors: Record<string, string> = {
  VIP: 'bg-amber-100 text-amber-800 border-amber-200',
  حساسیت: 'bg-rose-100 text-rose-800 border-rose-200',
  'رنگ خاص': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  'نیاز به پیگیری': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  بدقول: 'bg-orange-100 text-orange-800 border-orange-200',
}

/** Phones 09129900*** — removed and reinserted each run for retention / today / tags demos. */
async function seedRetentionAndFeaturesDemo(salonId: string) {
  const todayStr = salonYmdTehran()
  const yesterdayStr = addDaysYmd(todayStr, -1)
  const d10 = addDaysYmd(todayStr, -10)
  const d20 = addDaysYmd(todayStr, -20)
  const d45 = addDaysYmd(todayStr, -45)
  const d75 = addDaysYmd(todayStr, -75)

  const existingDemo = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.salonId, salonId), like(clients.phone, '09129900%')))
  const demoIds = existingDemo.map((r) => r.id)
  if (demoIds.length > 0) {
    await db.delete(appointments).where(inArray(appointments.clientId, demoIds))
    await db.delete(clientTags).where(inArray(clientTags.clientId, demoIds))
    await db.delete(clientFollowUps).where(inArray(clientFollowUps.clientId, demoIds))
    await db.delete(clients).where(inArray(clients.id, demoIds))
  }

  const manager = await db
    .select()
    .from(users)
    .where(and(eq(users.salonId, salonId), eq(users.role, 'manager')))
    .limit(1)
    .then((r) => r[0])
  const staffOrdered = await db
    .select()
    .from(users)
    .where(and(eq(users.salonId, salonId), eq(users.active, true), eq(users.role, 'staff')))
    .orderBy(asc(users.name))
  const staffA = staffOrdered[0]
  const staffB = staffOrdered[1]
  if (!manager || !staffA || !staffB) {
    console.warn('Skip feature demo seed: need manager + 2 staff.')
    return
  }

  const svcRows = await db.select().from(services).where(eq(services.salonId, salonId))
  const hair = svcRows.find((s) => s.name === 'کوتاهی مو')
  const color = svcRows.find((s) => s.name === 'رنگ مو')
  const manicure = svcRows.find((s) => s.name === 'مانیکور')
  const skincare = svcRows.find((s) => s.name === 'پاکسازی صورت')
  const massage = svcRows.find((s) => s.name === 'ماساژ سوئدی')
  if (!hair || !color || !manicure || !skincare || !massage) {
    console.warn('Skip feature demo seed: services missing.')
    return
  }

  const nowMin = hmToMinutes(currentHmTehran())
  let overdueDate = todayStr
  let overdueStart: string
  let overdueEnd: string
  if (nowMin < 120) {
    overdueDate = yesterdayStr
    overdueStart = '15:00'
    overdueEnd = '16:30'
  } else {
    overdueStart = minutesToHm(nowMin - 75)
    overdueEnd = minutesToHm(nowMin - 15)
  }

  let soonStart = minutesToHm(nowMin + 35)
  let soonEnd = minutesToHm(nowMin + 95)
  if (hmToMinutes(soonEnd) > 18 * 60 + 30 || hmToMinutes(soonStart) < 9 * 60) {
    soonStart = '11:00'
    soonEnd = '11:45'
  }

  const demoClientSpecs = [
    { phone: '09129900101', name: 'دمو غیرفعال', notes: '[seed-demo] آخرین مراجعهٔ تکمیل‌شده بیش از ۶۰ روز پیش' },
    { phone: '09129900102', name: 'دمو بدون نوبت دوم', notes: '[seed-demo] فقط یک مراجعهٔ انجام‌شده' },
    { phone: '09129900103', name: 'دمو غیبت', notes: '[seed-demo] دو غیبت برای پیگیری' },
    { phone: '09129900104', name: 'دمو VIP امروز', notes: '[seed-demo] برچسب VIP + نوبت امروز' },
    { phone: '09129900105', name: 'دمو بار اول', notes: '[seed-demo] اولین نوبت فقط امروز' },
    { phone: '09129900106', name: 'دمو آمار', notes: '[seed-demo] لغو و انجام‌شده' },
    { phone: '09129900107', name: 'دمو ارزشمند', notes: '[seed-demo] چند مراجعهٔ پرهزینه' },
    { phone: '09129900108', name: 'دمو پیگیری ردشده', notes: '[seed-demo] follow-up dismissed' },
  ] as const

  const insertedClients = await db
    .insert(clients)
    .values(demoClientSpecs.map((c) => ({ ...c, salonId })))
    .returning()

  const byPhone = (phone: string) => insertedClients.find((c) => c.phone === phone)!
  const cInactive = byPhone('09129900101')
  const cNewOnly = byPhone('09129900102')
  const cNoShow = byPhone('09129900103')
  const cVipToday = byPhone('09129900104')
  const cFirstToday = byPhone('09129900105')
  const cStats = byPhone('09129900106')
  const cHighValue = byPhone('09129900107')
  const cDismissed = byPhone('09129900108')

  await db.insert(clientTags).values([
    { salonId, clientId: cVipToday.id, label: 'VIP', color: tagColors.VIP },
    { salonId, clientId: cStats.id, label: 'حساسیت', color: tagColors['حساسیت'] },
    { salonId, clientId: cHighValue.id, label: 'بدقول', color: tagColors['بدقول'] },
  ])

  const legacyVip = await db
    .select()
    .from(clients)
    .where(and(eq(clients.salonId, salonId), eq(clients.phone, '09121234567')))
    .limit(1)
  if (legacyVip[0]) {
    await db
      .insert(clientTags)
      .values({
        salonId,
        clientId: legacyVip[0].id,
        label: 'VIP',
        color: tagColors.VIP,
      })
      .onConflictDoUpdate({
        target: [clientTags.salonId, clientTags.clientId, clientTags.label],
        set: { color: tagColors.VIP },
      })
  }

  await db.insert(clientFollowUps).values({
    salonId,
    clientId: cDismissed.id,
    reason: 'manual',
    status: 'dismissed',
    dueDate: todayStr,
    reviewedAt: null,
  })

  const aptRows: (typeof appointments.$inferInsert)[] = [
    {
      salonId,
      clientId: cInactive.id,
      staffId: staffA.id,
      serviceId: hair.id,
      date: d75,
      startTime: '10:00',
      endTime: '10:45',
      status: 'completed',
      notes: '[seed-demo]',
      createdByUserId: manager.id,
    },
    {
      salonId,
      clientId: cNewOnly.id,
      staffId: staffB.id,
      serviceId: manicure.id,
      date: d10,
      startTime: '11:00',
      endTime: '11:30',
      status: 'completed',
      notes: '[seed-demo]',
      createdByUserId: manager.id,
    },
    {
      salonId,
      clientId: cNoShow.id,
      staffId: staffA.id,
      serviceId: hair.id,
      date: d20,
      startTime: '09:00',
      endTime: '09:45',
      status: 'no-show',
      notes: '[seed-demo]',
      createdByUserId: manager.id,
    },
    {
      salonId,
      clientId: cNoShow.id,
      staffId: staffB.id,
      serviceId: manicure.id,
      date: d45,
      startTime: '14:00',
      endTime: '14:30',
      status: 'no-show',
      notes: '[seed-demo]',
      createdByUserId: manager.id,
    },
    {
      salonId,
      clientId: cNoShow.id,
      staffId: staffA.id,
      serviceId: skincare.id,
      date: d10,
      startTime: '16:00',
      endTime: '17:00',
      status: 'completed',
      notes: '[seed-demo]',
      createdByUserId: manager.id,
    },
    {
      salonId,
      clientId: cNoShow.id,
      staffId: staffB.id,
      serviceId: hair.id,
      date: todayStr,
      startTime: '13:00',
      endTime: '13:45',
      status: 'scheduled',
      notes: '[seed-demo] سابقهٔ غیبت + نوبت امروز',
      createdByUserId: manager.id,
    },
    {
      salonId,
      clientId: cVipToday.id,
      staffId: staffA.id,
      serviceId: color.id,
      date: todayStr,
      startTime: '12:00',
      endTime: '14:00',
      status: 'scheduled',
      notes: '[seed-demo] VIP امروز',
      createdByUserId: manager.id,
    },
    {
      salonId,
      clientId: cFirstToday.id,
      staffId: staffB.id,
      serviceId: hair.id,
      date: todayStr,
      startTime: soonStart,
      endTime: soonEnd,
      status: 'scheduled',
      notes: '[seed-demo] زمان نسبی برای «نزدیک است»',
      createdByUserId: manager.id,
    },
    {
      salonId,
      clientId: cStats.id,
      staffId: staffA.id,
      serviceId: hair.id,
      date: d20,
      startTime: '10:00',
      endTime: '10:45',
      status: 'completed',
      notes: '[seed-demo]',
      createdByUserId: manager.id,
    },
    {
      salonId,
      clientId: cStats.id,
      staffId: staffB.id,
      serviceId: manicure.id,
      date: d10,
      startTime: '15:00',
      endTime: '15:30',
      status: 'cancelled',
      notes: '[seed-demo]',
      createdByUserId: manager.id,
    },
    {
      salonId,
      clientId: cHighValue.id,
      staffId: staffA.id,
      serviceId: color.id,
      date: addDaysYmd(todayStr, -30),
      startTime: '10:00',
      endTime: '12:00',
      status: 'completed',
      notes: '[seed-demo]',
      createdByUserId: manager.id,
    },
    {
      salonId,
      clientId: cHighValue.id,
      staffId: staffA.id,
      serviceId: color.id,
      date: addDaysYmd(todayStr, -25),
      startTime: '10:00',
      endTime: '12:00',
      status: 'completed',
      notes: '[seed-demo]',
      createdByUserId: manager.id,
    },
    {
      salonId,
      clientId: cHighValue.id,
      staffId: staffB.id,
      serviceId: massage.id,
      date: addDaysYmd(todayStr, -15),
      startTime: '11:00',
      endTime: '12:00',
      status: 'completed',
      notes: '[seed-demo]',
      createdByUserId: manager.id,
    },
    {
      salonId,
      clientId: cHighValue.id,
      staffId: staffB.id,
      serviceId: color.id,
      date: addDaysYmd(todayStr, -5),
      startTime: '09:00',
      endTime: '11:00',
      status: 'completed',
      notes: '[seed-demo]',
      createdByUserId: manager.id,
    },
    {
      salonId,
      clientId: cInactive.id,
      staffId: staffB.id,
      serviceId: skincare.id,
      date: overdueDate,
      startTime: overdueStart,
      endTime: overdueEnd,
      status: 'confirmed',
      notes: '[seed-demo] برای «نیاز به ثبت نتیجه»',
      createdByUserId: manager.id,
    },
  ]

  await db.insert(appointments).values(aptRows)

  const days = [0, 1, 2, 3, 4, 5, 6] as const
  for (const dayOfWeek of days) {
    const active = dayOfWeek !== 5
    await db
      .insert(staffSchedules)
      .values({
        salonId,
        staffId: staffB.id,
        dayOfWeek,
        workingStart: '09:00',
        workingEnd: '18:00',
        active,
      })
      .onConflictDoUpdate({
        target: [staffSchedules.salonId, staffSchedules.staffId, staffSchedules.dayOfWeek],
        set: {
          active,
          workingStart: '09:00',
          workingEnd: '18:00',
          updatedAt: new Date(),
        },
      })
  }

  console.log('Feature demo: clients 09129900101–09129900108 refreshed.')
}

async function main() {
  const [primarySalon] = await db
    .insert(salons)
    .values({
      name: 'سالن آراویرا',
      slug: 'aravira',
      phone: '02100000000',
      address: 'تهران',
      timezone: 'Asia/Tehran',
      locale: 'fa-IR',
      status: 'active',
    })
    .onConflictDoUpdate({
      target: salons.slug,
      set: {
        name: 'سالن آراویرا',
        phone: '02100000000',
        address: 'تهران',
        timezone: 'Asia/Tehran',
        locale: 'fa-IR',
        status: 'active',
        updatedAt: new Date(),
      },
    })
    .returning()

  const [secondSalon] = await db
    .insert(salons)
    .values({
      name: 'سالن نیلوفر',
      slug: 'niloufar',
      phone: '02100000001',
      address: 'تهران، سعادت‌آباد',
      timezone: 'Asia/Tehran',
      locale: 'fa-IR',
      status: 'active',
    })
    .onConflictDoUpdate({
      target: salons.slug,
      set: {
        name: 'سالن نیلوفر',
        phone: '02100000001',
        address: 'تهران، سعادت‌آباد',
        timezone: 'Asia/Tehran',
        locale: 'fa-IR',
        status: 'active',
        updatedAt: new Date(),
      },
    })
    .returning()

  // Repair early local seeds that were inserted without the leading zero.
  await db.update(users).set({ phone: '09120000000' }).where(eq(users.phone, '9120000000'))
  await db.update(users).set({ phone: '09120000001' }).where(eq(users.phone, '9120000001'))
  await db.update(users).set({ phone: '09120000002' }).where(eq(users.phone, '9120000002'))

  await db
    .insert(businessSettings)
    .values({
      salonId: primarySalon.id,
      workingStart: '09:00',
      workingEnd: '19:00',
      slotDurationMinutes: 30,
    })
    .onConflictDoUpdate({
      target: businessSettings.salonId,
      set: {
        workingStart: '09:00',
        workingEnd: '19:00',
        slotDurationMinutes: 30,
      },
    })

  await db
    .insert(businessSettings)
    .values({
      salonId: secondSalon.id,
      workingStart: '10:00',
      workingEnd: '18:00',
      slotDurationMinutes: 30,
    })
    .onConflictDoUpdate({
      target: businessSettings.salonId,
      set: {
        workingStart: '10:00',
        workingEnd: '18:00',
        slotDurationMinutes: 30,
      },
    })

  const [primaryLocation] = await db
    .insert(locations)
    .values({
      salonId: primarySalon.id,
      name: 'شعبه اصلی',
      address: 'تهران',
      phone: '02100000000',
      active: true,
    })
    .onConflictDoUpdate({
      target: [locations.salonId, locations.name],
      set: {
        address: 'تهران',
        phone: '02100000000',
        active: true,
        updatedAt: new Date(),
      },
    })
    .returning()

  const [secondLocation] = await db
    .insert(locations)
    .values({
      salonId: secondSalon.id,
      name: 'شعبه اصلی',
      address: 'تهران، سعادت‌آباد',
      phone: '02100000001',
      active: true,
    })
    .onConflictDoUpdate({
      target: [locations.salonId, locations.name],
      set: {
        address: 'تهران، سعادت‌آباد',
        phone: '02100000001',
        active: true,
        updatedAt: new Date(),
      },
    })
    .returning()

  await db
    .insert(resources)
    .values([
      {
        salonId: primarySalon.id,
        locationId: primaryLocation.id,
        name: 'اتاق رنگ',
        type: 'room',
        active: true,
      },
      {
        salonId: primarySalon.id,
        locationId: primaryLocation.id,
        name: 'صندلی شماره ۱',
        type: 'chair',
        active: true,
      },
      {
        salonId: secondSalon.id,
        locationId: secondLocation.id,
        name: 'صندلی شماره ۱',
        type: 'chair',
        active: true,
      },
    ])
    .onConflictDoNothing()

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

  const [{ value: serviceCount }] = await db
    .select({ value: count() })
    .from(services)
    .where(eq(services.salonId, primarySalon.id))
  if (serviceCount === 0) {
    await db.insert(services).values(serviceRows.map((row) => ({ ...row, salonId: primarySalon.id })))
  }

  const [{ value: userCount }] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.salonId, primarySalon.id))
  if (userCount === 0) {
    await db.insert(users).values([
      {
        salonId: primarySalon.id,
        name: 'مدیر سالن',
        phone: '09120000000',
        passwordHash,
        role: 'manager',
        color: 'bg-staff-1',
        active: true,
      },
      {
        salonId: primarySalon.id,
        name: 'مریم احمدی',
        phone: '09120000001',
        passwordHash,
        role: 'staff',
        color: 'bg-staff-2',
        active: true,
      },
      {
        salonId: primarySalon.id,
        name: 'فاطمه رضایی',
        phone: '09120000002',
        passwordHash,
        role: 'staff',
        color: 'bg-staff-3',
        active: true,
      },
    ])
  }

  /** Extra demo staff (idempotent) — only one service for autofill smoke tests. */
  const [existingSara] = await db.select().from(users).where(eq(users.phone, '09120000003')).limit(1)
  if (!existingSara) {
    await db.insert(users).values({
      salonId: primarySalon.id,
      name: 'سارا محمودی',
      phone: '09120000003',
      passwordHash,
      role: 'staff',
      color: 'bg-staff-4',
      active: true,
    })
  }

  const clientRows = [
    { name: 'زهرا کریمی', phone: '09121234567', notes: 'مشتری ثابت' },
    { name: 'نازنین حسینی', phone: '09122345678', notes: null },
    { name: 'مهسا علیزاده', phone: '09123456789', notes: 'ترجیح می‌دهد عصر مراجعه کند' },
    { name: 'سمیرا باقری', phone: '09124567890', notes: null },
    { name: 'الهام نوری', phone: '09125678901', notes: 'حساسیت به رنگ' },
  ]

  const [{ value: clientCount }] = await db
    .select({ value: count() })
    .from(clients)
    .where(eq(clients.salonId, primarySalon.id))
  if (clientCount === 0) {
    await db.insert(clients).values(clientRows.map((row) => ({ ...row, salonId: primarySalon.id })))
  }

  const allUsers = await db.select().from(users).where(eq(users.salonId, primarySalon.id))
  const allServices = await db.select().from(services).where(eq(services.salonId, primarySalon.id))
  const allClients = await db.select().from(clients).where(eq(clients.salonId, primarySalon.id))

  const manager = allUsers.find((u) => u.role === 'manager')
  const staffUsersOrdered = await db
    .select()
    .from(users)
    .where(and(eq(users.salonId, primarySalon.id), eq(users.active, true), eq(users.role, 'staff')))
    .orderBy(asc(users.name))
  const staffA = staffUsersOrdered[0]
  const staffB = staffUsersOrdered[1]

  /** Full-week hours so calendar bookings on any weekday match E2E + demo (UTC weekday from YYYY-MM-DD). */
  const primaryWeek = [0, 1, 2, 3, 4, 5, 6] as const
  for (const member of [staffA, staffB].filter(Boolean) as NonNullable<typeof staffA>[]) {
    for (const dayOfWeek of primaryWeek) {
      await db
        .insert(staffSchedules)
        .values({
          salonId: primarySalon.id,
          staffId: member.id,
          dayOfWeek,
          workingStart: '09:00',
          workingEnd: '18:00',
          active: true,
        })
        .onConflictDoUpdate({
          target: [staffSchedules.salonId, staffSchedules.staffId, staffSchedules.dayOfWeek],
          set: {
            active: true,
            workingStart: '09:00',
            workingEnd: '18:00',
            updatedAt: new Date(),
          },
        })
    }
  }

  const hairService = allServices.find((s) => s.name === 'کوتاهی مو')
  const colorService = allServices.find((s) => s.name === 'رنگ مو')
  const manicureService = allServices.find((s) => s.name === 'مانیکور')
  const skincareService = allServices.find((s) => s.name === 'پاکسازی صورت')
  const massageService = allServices.find((s) => s.name === 'ماساژ سوئدی')

  if (
    staffA &&
    staffB &&
    hairService &&
    colorService &&
    manicureService &&
    massageService &&
    skincareService
  ) {
    await db
      .insert(staffServices)
      .values([
        { salonId: primarySalon.id, staffUserId: staffA.id, serviceId: hairService.id },
        { salonId: primarySalon.id, staffUserId: staffA.id, serviceId: colorService.id },
        { salonId: primarySalon.id, staffUserId: staffA.id, serviceId: massageService.id },
        { salonId: primarySalon.id, staffUserId: staffB.id, serviceId: hairService.id },
        { salonId: primarySalon.id, staffUserId: staffB.id, serviceId: colorService.id },
        { salonId: primarySalon.id, staffUserId: staffB.id, serviceId: manicureService.id },
        { salonId: primarySalon.id, staffUserId: staffB.id, serviceId: skincareService.id },
      ])
      .onConflictDoNothing()
  }

  const [staffOneService] = await db
    .select()
    .from(users)
    .where(and(eq(users.salonId, primarySalon.id), eq(users.active, true), eq(users.phone, '09120000003')))
    .limit(1)
  if (staffOneService && massageService) {
    await db
      .insert(staffServices)
      .values([{ salonId: primarySalon.id, staffUserId: staffOneService.id, serviceId: massageService.id }])
      .onConflictDoNothing()
  }

  const today = new Date()
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

  const [{ value: appointmentCount }] = await db
    .select({ value: count() })
    .from(appointments)
    .where(eq(appointments.salonId, primarySalon.id))
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
        salonId: primarySalon.id,
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
        salonId: primarySalon.id,
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
        salonId: primarySalon.id,
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
        salonId: primarySalon.id,
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

  const [{ value: secondUserCount }] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.salonId, secondSalon.id))
  if (secondUserCount === 0) {
    await db.insert(users).values({
      salonId: secondSalon.id,
      name: 'مدیر نیلوفر',
      phone: '09130000000',
      passwordHash,
      role: 'manager',
      color: 'bg-staff-1',
      active: true,
    })
  }

  const [{ value: secondServiceCount }] = await db
    .select({ value: count() })
    .from(services)
    .where(eq(services.salonId, secondSalon.id))
  if (secondServiceCount === 0) {
    await db.insert(services).values({
      salonId: secondSalon.id,
      name: 'براشینگ',
      category: 'hair',
      duration: 45,
      price: 450_000,
      color: 'bg-staff-2',
      active: true,
    })
  }

  const [{ value: secondClientCount }] = await db
    .select({ value: count() })
    .from(clients)
    .where(eq(clients.salonId, secondSalon.id))
  if (secondClientCount === 0) {
    await db.insert(clients).values({
      salonId: secondSalon.id,
      name: 'مشتری نیلوفر',
      phone: '09121234567',
      notes: 'شماره تکراری در سالن دیگر برای تست unique per salon',
    })
  }

  await seedRetentionAndFeaturesDemo(primarySalon.id)

  console.log('Seed complete.')
  console.log('Manager: 09120000000 / admin123')
  console.log('Second salon manager: 09130000000 / admin123')
  console.log('Staff: 09120000001, 09120000002, 09120000003 / admin123')
  console.log('سارا محمودی (09120000003) فقط ماساژ سوئدی — برای تست پیش‌پر یک خدمت.')
  await client.end()
}

main().catch(async (e) => {
  console.error(e)
  await client.end({ timeout: 1 })
  process.exit(1)
})
