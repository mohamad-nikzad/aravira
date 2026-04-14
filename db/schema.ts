import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().$type<'manager' | 'staff'>(),
  color: text('color').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  category: text('category').notNull().$type<'hair' | 'nails' | 'skincare' | 'spa'>(),
  duration: integer('duration').notNull(),
  price: integer('price').notNull(),
  color: text('color').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'restrict' }),
  staffId: uuid('staff_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  serviceId: uuid('service_id')
    .notNull()
    .references(() => services.id, { onDelete: 'restrict' }),
  date: text('date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  status: text('status')
    .notNull()
    .$type<'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'>(),
  notes: text('notes'),
  createdByUserId: uuid('created_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Single-row table: use id = 1 */
export const businessSettings = pgTable('business_settings', {
  id: integer('id').primaryKey().default(1),
  workingStart: text('working_start').notNull().default('09:00'),
  workingEnd: text('working_end').notNull().default('19:00'),
  slotDurationMinutes: integer('slot_duration_minutes').notNull().default(30),
})
