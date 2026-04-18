# Multi-Tenant Salon MVP Plan

## Context

Aravira is currently a single-salon internal management app. It already has the core operational surface for a salon: calendar, appointments, clients, staff, services, business hours, dashboard metrics, authentication, staff roles, and push notification groundwork.

The next product step is to turn it into a multi-tenant MVP where any salon manager can sign up, create a salon workspace, define services, add staff, configure general settings, and start managing appointments.

Payments, subscriptions, public marketplace, and full white-label behavior are intentionally out of scope for the first MVP. The architecture should still be ready for larger salons and future white-label customers.

## Product Direction

Position the MVP as:

> A lightweight booking and operations platform for beauty salons, with Persian/Jalali-friendly workflows, staff calendars, service-based scheduling, and a path toward customer self-booking.

Do not position it as a generic appointment platform yet. Beauty salons should remain the primary domain because the current data model, UI, terminology, and scheduling rules already fit that market.

## Architecture Decision

Keep using Next.js API routes for this phase.

Reasoning:

- The current app is already built on Next route handlers, Drizzle, Neon, SWR, and cookie-based auth.
- The main challenge is multi-tenant data isolation, not backend framework choice.
- A dedicated backend would add migration cost before the product model is proven.
- We can keep future optionality by moving business logic into server-only service modules and keeping route handlers thin.

Target backend structure:

```txt
app/api/...                    Thin HTTP route handlers
lib/server/auth/...            Session and current-user context
lib/server/tenant/...          Tenant resolution and authorization
lib/server/salons/...          Salon creation/profile logic
lib/server/services/...        Service business logic
lib/server/staff/...           Staff business logic
lib/server/clients/...         Client business logic
lib/server/appointments/...    Appointment and conflict logic
lib/server/settings/...        Business settings logic
```

Every service function should accept an authenticated context or explicit `salonId`. API routes must derive `salonId` from the session, never from client input.

## Database Branching Plan

Use a dedicated Neon branch for this work.

Recommended branch name:

```txt
feature/multitenant-salon-mvp
```

Suggested local env file:

```txt
.env.database.multitenant
```

Implementation notes:

- Create the Neon branch from the current dev branch unless production data is required for migration testing.
- Point local development to the feature branch while building the schema migration.
- Prefer checked-in Drizzle migrations once the schema is clear.
- Use `db:push` only for early exploration on the feature branch.
- Update seed data to create at least two salons so tenant isolation can be tested.

## Phase 0: Scope And Decisions

Goal: lock the MVP boundary before touching the schema.

In scope:

- Manager signup.
- Salon workspace creation.
- Tenant-scoped login/session.
- Services.
- Staff.
- Clients.
- Appointments.
- Business hours/general settings.
- Dashboard scoped to one salon.
- Staff role scoped to one salon.
- Foundation for larger salons.
- Foundation for future white-label customers.

Out of scope:

- Payments.
- Subscription billing.
- Deposits.
- POS.
- Payroll.
- Inventory.
- Public marketplace.
- Custom domains.
- Full white-label theming.
- Customer self-booking, unless explicitly pulled into a later MVP phase.

Acceptance criteria:

- The MVP definition is written down.
- We agree that the first launch is manager-operated salon management, not payments or marketplace booking.

## Phase 1: Multi-Tenant Data Model

Goal: every business-owned record belongs to a salon.

Add `salons` table:

```txt
id
name
slug
phone
address
timezone
locale
status
createdAt
updatedAt
```

Initial `status` values:

```txt
active
suspended
archived
```

Add `salonId` to:

- `users`
- `services`
- `clients`
- `appointments`
- `businessSettings`
- `pushSubscriptions`
- `staffServices`

Update uniqueness rules:

- `salons.slug` unique globally.
- `users.phone` can stay unique globally for the first MVP.
- `clients.phone` should become unique per salon.
- `services.name` may become unique per salon.
- `businessSettings` should become one row per salon instead of a single global row.

Recommended indexes:

```txt
appointments(salon_id, date)
appointments(salon_id, staff_id, date)
appointments(salon_id, client_id, date)
users(salon_id, role, active)
services(salon_id, active)
clients(salon_id, phone)
staff_services(salon_id, staff_user_id)
staff_services(salon_id, service_id)
```

Acceptance criteria:

- Two salons can exist in the same database.
- Each salon can have separate users, services, clients, settings, and appointments.
- Existing single-salon seed data is migrated or recreated under one salon.

## Phase 2: Tenant-Aware Auth And Context

Goal: every authenticated request has a trusted salon context.

Create a helper such as:

```ts
requireTenantUser()
```

It should return:

```ts
{
  userId: string
  salonId: string
  role: 'owner' | 'manager' | 'staff'
  name: string
  phone: string
}
```

Role plan:

- Keep current `manager` and `staff` if we want minimal disruption.
- Prefer introducing `owner` now or mapping first signup manager to `owner`.
- Later, `owner` can manage billing, white-label, and high-level salon settings.

Rules:

- Do not accept `salonId` from frontend requests for authenticated internal APIs.
- Derive `salonId` from the logged-in user.
- Staff can only access appointments assigned to them unless their role is elevated.
- Managers/owners can access all records in their salon only.

Acceptance criteria:

- Existing login works with tenant-aware users.
- Every protected route can access `salonId`.
- Staff from Salon A cannot access Salon B data by changing URLs or request bodies.

## Phase 3: Manager Signup And Salon Creation

Goal: a new salon manager can create a workspace without developer help.

Signup fields:

- Salon name.
- Salon slug, generated from name and editable.
- Manager name.
- Manager phone.
- Password.

Signup transaction:

1. Create `salons` row.
2. Create owner/manager user linked to that salon.
3. Create default business settings for the salon.
4. Start session.
5. Redirect to onboarding.

Important validation:

- Slug must be unique.
- Manager phone must be valid.
- Password must meet minimum strength.
- Salon name is required.

Acceptance criteria:

- A new manager can sign up and land in an empty salon workspace.
- Signup creates salon, manager user, and default settings atomically.
- Failed signup does not leave partial salon records behind.

## Phase 4: Tenant-Scope Existing APIs

Goal: all existing product features continue working, scoped to the current salon.

Update these APIs:

- `/api/staff`
- `/api/staff/[id]/services`
- `/api/services`
- `/api/services/[id]`
- `/api/clients`
- `/api/clients/[id]`
- `/api/appointments`
- `/api/appointments/[id]`
- `/api/dashboard`
- `/api/settings/business`
- `/api/push/config`
- `/api/push/subscribe`
- `/api/auth/me`

Update DB/service behavior:

- List queries filter by `salonId`.
- Create queries write `salonId`.
- Update/delete queries include `salonId` in the lookup.
- Appointment conflict detection only checks records in the same salon.
- Staff-service eligibility only compares staff/services in the same salon.
- Dashboard aggregates only current salon data.

Acceptance criteria:

- Two salons can create clients with the same phone number if client uniqueness is per salon.
- Salon A manager cannot see Salon B staff, clients, appointments, services, or dashboard data.
- Staff still only sees their own appointments.
- Existing appointment conflict tests are updated for tenant scope.

## Phase 5: Onboarding Experience

Goal: a new salon can become usable quickly after signup.

Recommended onboarding checklist:

1. Confirm salon profile.
2. Set working hours.
3. Add services.
4. Add staff.
5. Create first appointment.

Implementation approach:

- Add an onboarding page after signup.
- Show empty states that guide managers toward the next setup task.
- Keep skip/continue options so the app does not block real usage.

Acceptance criteria:

- A new manager can complete setup without seed data.
- Empty app states explain what to do next.
- Onboarding state is stored per salon.

## Phase 6: Large-Salon Readiness

Goal: avoid assumptions that only work for small salons.

Prepare the model for these future needs:

- Multiple locations under one salon/business.
- Per-staff schedules.
- Staff days off and exceptions.
- Resources such as rooms, chairs, devices, stations.
- More granular permissions.
- Larger calendars and faster appointment queries.

Do now:

- Avoid hardcoding one global working-hours model into business logic.
- Keep `businessSettings` salon-scoped, with room for future location/staff overrides.
- Keep appointment queries indexed by `salonId`, staff, client, and date.
- Keep role checks centralized.

Optional schema to add now if low-risk:

```txt
locations
  id
  salonId
  name
  address
  phone
  active
  createdAt

staffSchedules
  id
  salonId
  staffId
  dayOfWeek
  workingStart
  workingEnd
  active

resources
  id
  salonId
  locationId
  name
  type
  active
```

Recommendation:

- Do not build full UI for locations/resources yet.
- Add only the parts needed to prevent a painful rewrite later.

Acceptance criteria:

- The schema and service layer can later support large salons without rewriting tenant isolation.
- No core logic assumes all staff always share the same schedule forever.

## Phase 7: White-Label Readiness

Goal: prepare for special larger customers without implementing full white-label now.

Add minimal fields to `salons`:

```txt
brandName
logoUrl
primaryColor
publicSlug
```

Future tables, not required for this MVP:

```txt
customDomains
  id
  salonId
  domain
  status
  verificationToken
  verifiedAt
  createdAt

themeSettings
  id
  salonId
  primaryColor
  secondaryColor
  logoUrl
  faviconUrl
  customCss
```

Do now:

- Avoid hardcoded Aravira branding inside tenant-owned screens.
- Display the current salon name dynamically where appropriate.
- Keep platform/admin branding separate from salon/customer-facing branding.

Do later:

- Custom domains.
- Per-salon theme editor.
- Branded customer booking pages.
- Branded notification templates.

Acceptance criteria:

- A salon can have its own display name and basic brand fields.
- Future custom-domain work does not require changing the core tenant model.

## Phase 8: Testing And Security Hardening

Goal: make tenant isolation reliable before real customer use.

Required tests:

- Manager from Salon A cannot list Salon B clients.
- Manager from Salon A cannot update Salon B service by ID.
- Manager from Salon A cannot update/delete Salon B appointment by ID.
- Staff from Salon A cannot view Salon B appointments.
- Staff from Salon A only sees their own appointments.
- Appointment conflict detection ignores other salons.
- Client phone uniqueness is enforced per salon.
- Signup creates salon/user/settings in one transaction.

Production hardening:

- Remove demo credentials from production login screen.
- Require strong `JWT_SECRET`.
- Improve duplicate-phone and duplicate-slug errors.
- Add audit fields where needed.
- Validate route inputs consistently.
- Confirm all destructive actions are tenant-scoped.
- Confirm seed script can create multi-salon demo data.

Acceptance criteria:

- Tenant isolation tests pass.
- Production build passes.
- Manual test with two seeded salons confirms isolation.

## Phase 9: Optional Public Booking MVP

Goal: let each salon receive customer booking requests.

This phase should happen after multi-tenancy is stable.

Potential route:

```txt
/book/[salonSlug]
```

Customer flow:

1. Select service.
2. Select staff or "any staff".
3. Select available date/time.
4. Enter name and phone.
5. Submit booking request.

Recommended first version:

- Use booking requests that require manager confirmation.
- Avoid instant booking until availability and cancellation rules are stronger.

Possible model:

```txt
bookingRequests
  id
  salonId
  clientName
  clientPhone
  serviceId
  preferredStaffId
  date
  startTime
  endTime
  status
  notes
  createdAt
```

Acceptance criteria:

- Each salon has a public booking link.
- Customers can request a booking without logging in.
- Managers can approve, reject, or convert a request into an appointment.

## Phase 10: Future Dedicated Backend Evaluation

Goal: decide if the backend should be split later.

Stay with Next API routes unless these needs become real:

- High-volume background reminders.
- Complex SMS/WhatsApp queues.
- Public versioned mobile API.
- Many third-party webhooks.
- Enterprise integrations.
- Real-time staff coordination.
- Advanced reporting workloads.
- Separate backend team.

Likely next architecture before a full backend split:

```txt
Next.js app + Next API routes + Neon + background worker
```

Only split into a dedicated backend when the product pressure justifies it.

## Suggested Implementation Order

1. Create Neon feature branch.
2. Add `salons` and `salonId` migration.
3. Update seed data for two salons.
4. Add tenant-aware auth context.
5. Scope DB helpers and service modules.
6. Scope all existing API routes.
7. Add manager signup and default salon setup.
8. Add onboarding.
9. Add tenant isolation tests.
10. Prepare minimal white-label fields.
11. Re-test production build and migration path.

## First MVP Definition

The first MVP is complete when:

- A salon manager can sign up.
- A salon workspace is created automatically.
- The manager can define services.
- The manager can add staff.
- The manager can configure working hours/general settings.
- The manager can create and manage appointments.
- Staff can log in and see only their assigned appointments.
- Multiple salons can use the same deployment without seeing each other's data.
- The codebase is ready for future public booking, larger salons, and special white-label customers.
