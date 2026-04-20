# Aravira MVP Feature Plan: Smart Retention For Small Salons

## Summary

Position Aravira as a mobile-first salon manager app that helps small salons remember every client, run the day cleanly, and reduce forgotten follow-ups. Payments, public booking, automated customer messaging, multi-location operations, and SMS/WhatsApp integrations stay out of this MVP.

The app already has strong foundations: salon signup, onboarding, manager/staff roles, Jalali calendar, clients, services, staff, staff-service eligibility, appointment conflict checks, dashboard, PWA install, and staff push notifications. The MVP should now improve daily usefulness and retention, not add unrelated modules.

## MVP Product Promise

“Aravira helps a salon manager know who is coming today, what each client needs, who might be lost, and what follow-up work should happen next.”

## Feature Priorities

### 1. Client Memory

Build a richer client profile so Aravira feels meaningfully better than a plain calendar.

Add to the client detail experience:

- Full appointment history
- Next appointment
- Last completed visit
- Total completed visits
- Total estimated spend
- No-show count
- Cancelled count
- Favorite or most-used service
- Last staff member
- Client notes displayed prominently
- Optional client tags: `VIP`, `حساسیت`, `رنگ خاص`, `نیاز به پیگیری`, `بدقول`

Keep the existing `clients.notes` field, but add structured tags through a new table instead of stuffing everything into notes.

New table:

```ts
clientTags {
  id: uuid
  salonId: uuid
  clientId: uuid
  label: text
  color: text
  createdAt: timestamp
}
```

Acceptance criteria:

- Manager can open a client and immediately understand their history.
- Client list can show small badges for important tags.
- No new customer messaging is added.

### 2. Today Cockpit

Make the first useful screen for a working manager a “today” command center, not only a statistics dashboard.

Add a dashboard section or new `/today` route with:

- Today’s appointments grouped by status
- Pending appointments needing confirmation
- Appointments currently overdue for status update
- Empty/open slots by staff
- Staff workload for today
- Quick actions: confirm, completed, no-show, cancel
- “Needs attention” list

Rules for “needs attention”:

- Scheduled appointment starting within the next 2 hours
- Confirmed appointment whose end time has passed but is not completed/no-show
- Client with 2 or more no-shows
- First-time client coming today
- VIP client coming today

Acceptance criteria:

- Manager can run the day from one screen.
- Status updates do not require opening the full calendar every time.
- Existing appointment APIs can be reused, with one new aggregate endpoint.

New endpoint:

```ts
GET /api/today
```

Response shape:

```ts
{
  date: string,
  counts: {
    scheduled: number,
    confirmed: number,
    completed: number,
    cancelled: number,
    noShow: number
  },
  appointments: AppointmentWithDetails[],
  attentionItems: TodayAttentionItem[],
  staffLoad: Array<{
    staffId: string,
    staffName: string,
    appointmentCount: number,
    bookedMinutes: number
  }>
}
```

### 3. Retention Queue

Add a simple internal follow-up queue without customer messaging.

This is the unique MVP feature: the app tells the manager which clients deserve attention, but does not send messages automatically.

Add a `/retention` page or dashboard card with lists:

- Lost clients: no completed appointment in the last 60 days
- New clients without a second booking
- No-show clients needing manager review
- High-value clients: top spend or top visit count
- Clients with birthdays this month only if birthday is added later; not required for MVP

Each row should show:

- Client name
- Phone
- Last visit date
- Last service
- Suggested reason
- Quick actions: call, create appointment, mark reviewed

New table:

```ts
clientFollowUps {
  id: uuid
  salonId: uuid
  clientId: uuid
  reason: 'inactive' | 'no-show' | 'new-client' | 'vip' | 'manual'
  status: 'open' | 'reviewed' | 'dismissed'
  dueDate: text
  createdAt: timestamp
  updatedAt: timestamp
  reviewedAt: timestamp | null
}
```

New endpoints:

```ts
GET /api/retention
PATCH /api/retention/[id]
POST /api/clients/[id]/follow-ups
```

Acceptance criteria:

- The queue is generated from real appointment data.
- Manager can mark items reviewed/dismissed.
- No external message provider is required.

### 4. Staff Availability

The schema already has `staff_schedules`, but the current visible product does not expose a complete staff schedule workflow. This is important for production readiness.

Add staff schedule management inside the staff page:

- Weekly schedule per staff member
- Active/inactive day toggle
- Start/end time per working day
- “Use salon hours” shortcut
- Show unavailable staff in appointment form
- Block appointment creation outside that staff member’s active schedule

Validation rules:

- If staff has no schedule rows, fall back to salon business hours.
- If staff has a schedule row for the day and `active=false`, block booking.
- If appointment starts before `workingStart` or ends after `workingEnd`, block booking.
- Existing staff/client overlap validation stays unchanged.

New endpoints:

```ts
GET /api/staff/[id]/schedule
PUT /api/staff/[id]/schedule
```

Acceptance criteria:

- Manager cannot accidentally book staff outside working hours.
- Calendar still allows overlapping appointments only for different staff and different clients.
- Staff schedule behavior is covered by tests.

### 5. Client Detail Page

The current client list is useful but too shallow for retention. Add a dedicated client page or drawer.

Route:

```ts
/app/(app)/clients/[id]
```

Sections:

- Profile: name, phone, tags, notes
- Upcoming appointment
- Appointment history
- Retention summary
- Quick create appointment prefilled with this client
- Call action

New endpoint:

```ts
GET /api/clients/[id]/summary
```

Response shape:

```ts
{
  client: Client,
  tags: ClientTag[],
  upcomingAppointment: AppointmentWithDetails | null,
  history: AppointmentWithDetails[],
  stats: {
    completedCount: number,
    cancelledCount: number,
    noShowCount: number,
    estimatedSpend: number,
    lastVisitDate: string | null,
    favoriteServiceName: string | null
  },
  openFollowUps: ClientFollowUp[]
}
```

Acceptance criteria:

- Client profile is useful during phone calls and walk-ins.
- Manager can create a new appointment from the client page.

### 6. Better Business Insights

Upgrade the dashboard from “counts” to “manager decisions.”

Add metrics:

- Repeat client rate this month
- New vs returning clients
- No-show rate
- Cancellation rate
- Average appointment value
- Revenue by service
- Revenue by staff
- At-risk client count
- Top 5 clients by visits/spend

Acceptance criteria:

- Dashboard answers “what should I improve?” not only “what happened?”
- Revenue remains estimated from completed appointments and service prices.
- No payment logic is introduced.

### 7. Demo Readiness

Add a clean demo path for investors or free-product launch.

Required demo improvements:

- Seed data should include realistic clients, tags, histories, no-shows, completed appointments, and follow-up opportunities.
- Add a short in-app empty-state guide for new salons.
- Add sample services/staff during onboarding as optional templates.
- Add a manager guide page or compact PDF/HTML already aligned with current Persian docs.

Acceptance criteria:

- A new user can understand the app in under 5 minutes.
- An investor demo can show: today cockpit, client memory, retention queue, calendar, dashboard.

## Out Of Scope For This MVP

Do not build these yet:

- Payments
- Subscription plans
- Public customer booking page
- Automated SMS/WhatsApp reminders
- Online deposits
- Inventory
- Commission/payroll
- Multi-location UI
- Resource/room booking UI
- AI chatbot
- Customer mobile app

The database already has `locations` and `resources`, but those should stay dormant until the small-salon MVP is strong.

## Implementation Order

### Phase 1: Production Basics

1. Add staff availability UI and backend validation.
2. Add client detail summary endpoint.
3. Add client detail drawer/page with history and stats.
4. Add focused tests for schedule validation and client summaries.

### Phase 2: Retention Differentiator

1. Add `clientTags`.
2. Add `clientFollowUps`.
3. Build retention query logic.
4. Build retention queue UI.
5. Add “mark reviewed” and “dismiss” actions.

### Phase 3: Daily Workflow

1. Add `/api/today`.
2. Add Today Cockpit UI.
3. Add fast appointment status actions.
4. Highlight first-time, VIP, overdue, and no-show-risk appointments.

### Phase 4: Demo Polish

1. Improve seed data.
2. Add onboarding templates.
3. Upgrade dashboard insights.
4. Run mobile and desktop QA.
5. Prepare one demo salon account.

## Tests And Scenarios

Add or update tests for:

- Booking inside staff schedule succeeds.
- Booking before staff start time fails.
- Booking after staff end time fails.
- Booking on inactive staff day fails.
- No staff schedule falls back to salon business hours.
- Client summary calculates completed, cancelled, no-show, spend, last visit, and favorite service correctly.
- Retention queue identifies inactive clients.
- Retention queue identifies no-show clients.
- Retention queue excludes dismissed/reviewed items from open list.
- Today endpoint flags overdue appointments.
- Staff users still only see their own appointments.
- Tenant isolation remains enforced for all new endpoints.

## Assumptions

- First users are small salons with 2-8 staff.
- MVP is manager-first and mobile-first.
- Customer messaging is intentionally excluded.
- Revenue is estimated from service prices on completed appointments.
- Existing appointment model remains one appointment = one client + one staff + one service + one time range.
- Public booking and monetization can be planned after this MVP is genuinely useful.
