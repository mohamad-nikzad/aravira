# Manager Availability Lookup Plan

## Context

Aravira already supports the core ingredients needed for manager-side availability lookup:

- Services have default durations.
- Staff can be restricted to specific services.
- Staff schedules can override salon business hours.
- Appointment creation already enforces blocking overlap rules.
- The calendar and today screens already host manager booking actions.

What is missing is a manager-first workflow for answering live phone questions like:

> "Do you have time for keratin today?"
>
> "Is Sara free on Thursday for a haircut?"

The current app is slot-first. Managers choose a time in the calendar and then fill out appointment details. This feature needs the reverse flow: start from `service + date + optional staff`, then ask the system for bookable times.

## Product Goal

Add a manager productivity feature that helps staff answer availability questions quickly and confidently during customer calls.

This is not a customer self-booking system.

This is not call logging, analytics, notifications, or saved search history.

This is a manager-only lookup and handoff flow that answers:

- what times are available for a given service on a selected day
- optionally for a specific staff member
- with a fallback to the nearest future available time within one week

## Locked Product Decisions

These decisions are already agreed and should be treated as v1 scope boundaries.

### Audience and Entry Points

- Manager-only.
- Launch from:
  - `Calendar` page
  - `Today` page
- Do not launch from client pages or other surfaces in v1.

### Search Model

- Search one selected day at a time.
- Required filters:
  - `service`
  - `staff` dropdown with:
    - `any qualified staff`
    - one specific eligible staff member
  - `date`
- Prefill the date from the currently viewed page date.
- If there is no meaningful viewed date, fall back to today.
- Service must be selected before search is enabled.
- Search is manual through a `Check availability` action.
- When ordinary filters change, clear stale results and wait for a new search.
- When the manager navigates `previous day` or `next day` inside the availability flow, automatically rerun the search.

### Availability Rules

- Use the selected service's default duration.
- Use only grid-aligned start times based on salon `slotDurationMinutes`.
- For today:
  - hide past times
  - round up to the next valid slot boundary
- Respect current staff-service assignments.
- Exclude inactive staff.
- Use the existing scheduling rule:
  - if a staff member has schedule rows, those rows define availability
  - if a staff member has no schedule rows, fall back to salon business hours
- Use the same blocking appointment statuses as booking validation.
- Use service duration only. No automatic buffer time in v1.

### Result Presentation

- Show exact start times, not free windows.
- Show `start + end` time for each suggested slot.
- In `any qualified staff` mode:
  - group results by staff
  - hide staff groups with no times
  - sort groups by earliest available slot, then staff name
- Add a small selected-date header above results.

### Empty States and Fallback

- Stay on the selected day when no results exist.
- Show a `nearest available time` action in the empty state.
- Search forward up to 7 days.
- Return a single nearest option, not multiple suggestions.
- Keep the currently selected date unchanged when nearest availability is found.
- Show the nearest result as a separate tappable card inside the same drawer.
- Use specific empty-state reasons when known, not only a generic message.

### Booking Handoff

- Tapping a result closes the availability drawer and opens the existing appointment drawer.
- The appointment drawer should be prefilled with:
  - date
  - time
  - staff
  - service
- These fields remain editable.
- Save-time validation remains the source of truth if the manager edits details afterward.
- Keep the existing temporary/incomplete client workflow in the appointment drawer.

### Known V1 Caveat

- Availability lookup in v1 does **not** check client-overlap conflicts.
- Final appointment save still validates client conflicts.
- After results appear, show a small warning that final confirmation happens during booking.

### Operational Constraints

- Online-only in v1.
- No call logs.
- No saved search history.
- No analytics instrumentation required for v1.
- No new notifications for this feature.

## Recommended UX

### Calendar Page

- Add a labeled `Check availability` action in the top control area above the calendar.
- Do not add a second floating action button.
- Keep the existing `+` floating button focused on direct appointment creation.

### Today Page

- Add a `Check availability` header action beside `نوبت جدید`.
- Prefill the drawer date from the page's currently selected date, not always literal today.
- If booking succeeds from the today flow for a different date than the one currently being viewed, redirect to the calendar page for the booked date so the save feels visible.

### Drawer Layout

Use a full-screen mobile drawer, matching the existing appointment flows.

Recommended section order:

1. Title and brief description.
2. Filters:
   - service picker
   - staff dropdown
   - date picker
3. `Check availability` button.
4. Optional warning shown only after results appear.
5. Results area:
   - selected date header
   - grouped slot list or empty state
6. Day navigation controls.

Recommended behavior details:

- The staff dropdown should contain only:
  - `any qualified staff`
  - staff members eligible for the selected service
- If the manager had selected a specific staff member and then changes to a service that they cannot perform, reset the dropdown to `any qualified staff`.
- Keep the UI clean; do not add persistent helper text before results exist.

## Recommended API Design

Add a new dedicated manager-only endpoint instead of stretching the current slot-based staff availability route.

Recommended path:

```txt
GET /api/appointments/availability
```

Reasoning:

- The existing `/api/staff/booking-availability` route answers a different question:
  - "who is available for this exact start/end slot?"
- The new feature needs day search and nearest search for a service-driven workflow.
- Keeping the new contract separate will make testing and maintenance much clearer.

## API Modes

Support both workflows through one endpoint:

- `mode=day`
- `mode=nearest`

## Recommended Query Shape

```txt
/api/appointments/availability?mode=day&serviceId=...&date=...&staffId=...
```

`staffId` is optional. When omitted, use `any qualified staff`.

## Response Shape

Keep the API data-focused. Do not return presentation-formatted Persian strings.

Recommended slot shape:

```ts
type AvailabilitySlot = {
  date: string
  startTime: string
  endTime: string
  staffId: string
  staffName: string
}
```

Recommended response:

```ts
type AvailabilityEmptyReason =
  | 'NO_QUALIFIED_STAFF'
  | 'STAFF_OFF_DAY'
  | 'ALL_QUALIFIED_STAFF_OFF_DAY'
  | 'FULLY_BOOKED'
  | 'OUTSIDE_SEARCH_WINDOW'

type AvailabilityResponse =
  | {
      mode: 'day'
      slots: AvailabilitySlot[]
      emptyReason?: AvailabilityEmptyReason
    }
  | {
      mode: 'nearest'
      slot: AvailabilitySlot | null
      emptyReason?: AvailabilityEmptyReason
    }
```

`mode=day` returns a flat slot list.

`mode=nearest` returns one slot or `null`.

The frontend is responsible for:

- grouping by staff
- sorting visual groups
- rendering Persian labels
- showing specific empty-state copy based on `emptyReason`

## Availability Algorithm

Implement the availability engine by deriving free ranges per eligible staff member and then turning those ranges into valid bookable starts.

This is the right fit because the codebase already computes open ranges per staff for today-style reporting.

### Inputs

- tenant salon context from manager auth
- `serviceId`
- `date`
- optional `staffId`
- `mode`

### Validation

- Require manager auth.
- Require `serviceId`, `date`, and `mode`.
- Validate the service exists and is active.
- If `staffId` is provided:
  - validate the staff member exists
  - validate they are active
  - validate they are eligible for the selected service
- Reject offline assumptions at the UI layer; this route should assume online server execution only.

### Staff Selection

- Start from active staff only.
- Filter to staff eligible for the service.
- If `staffId` is provided, reduce to that one staff member.

### Day Search

For each eligible staff member on the selected date:

1. Resolve the working window.
2. Load blocking appointments for that staff member on the date.
3. Derive free ranges from:
   - schedule or salon hours
   - minus blocking appointments
4. For today, trim anything before the next valid rounded slot.
5. Convert each free range into grid-aligned start times where the full service duration fits.
6. Emit slots with calculated `endTime`.

### Nearest Search

Starting from the selected date, search forward up to 7 days:

1. Run the same staff/service/day logic.
2. On the selected day, start from the current rounded slot if the selected day is today.
3. Stop at the earliest valid slot found.
4. Break equal-time ties by staff name.

### Empty Reason Guidance

Recommended mapping:

- No eligible staff for the service:
  - `NO_QUALIFIED_STAFF`
- Specific staff selected but not working that day:
  - `STAFF_OFF_DAY`
- Any-staff mode and all eligible staff are off that day:
  - `ALL_QUALIFIED_STAFF_OFF_DAY`
- Staff are working but no slot fits due to bookings:
  - `FULLY_BOOKED`
- Nearest search finds nothing within one week:
  - `OUTSIDE_SEARCH_WINDOW`

## Frontend Implementation Plan

### New UI Surface

Add a new shared drawer component, for example:

```txt
apps/app/components/calendar/availability-drawer.tsx
```

The component should:

- work from both `Calendar` and `Today`
- accept initial date context
- fetch only when the manager explicitly starts a search
- clear stale results on ordinary filter changes
- auto-refetch on internal day navigation
- hand off into the existing appointment drawer when a slot is chosen

### Appointment Drawer Handoff

The current appointment drawer already accepts `initialDate`, `initialTime`, and `initialClientId`.

To support this feature cleanly, extend it with prefill props such as:

```ts
initialStaffId?: string
initialServiceId?: string
```

These should prefill the form without locking those fields.

### Calendar Page Changes

Update the calendar page to:

- add a visible `Check availability` trigger near the view/staff controls
- open the shared availability drawer
- pass the currently viewed calendar date as the initial drawer date
- on slot selection:
  - close availability drawer
  - open appointment drawer with selected slot and prefilled service/staff

### Today Page Changes

Update the today page to:

- add a `Check availability` action beside `نوبت جدید`
- pass the page's selected date into the shared availability drawer
- on successful booking:
  - stay on the page if the booked appointment matches the currently viewed date
  - redirect to `/calendar?date=...` if the booked appointment is for a different day

## Suggested Delivery Phases

### Phase 1: Core Availability Engine

Goal: establish one source of truth for day search and nearest search.

Tasks:

- Add a dedicated availability query function in the database/server layer.
- Reuse existing schedule and overlap primitives where possible.
- Implement range-to-grid-slot conversion.
- Add reason-code output for empty results.

Acceptance criteria:

- Given a service, date, and optional staff member, the backend returns truthful bookable slots.
- Day and nearest modes share the same logic base.
- Today handling correctly hides past times and rounds up to the next slot.

### Phase 2: API Route

Goal: expose the feature safely to the app.

Tasks:

- Add the new manager-only route.
- Validate query parameters and auth.
- Return flat slot data plus optional empty reason.

Acceptance criteria:

- Managers can call the route successfully.
- Non-managers cannot use it.
- Bad inputs return clear validation errors.

### Phase 3: Calendar UI

Goal: make the feature usable from the calendar page.

Tasks:

- Add the top-bar trigger.
- Build the drawer UI and day-navigation behavior.
- Group flat slots by staff in the frontend.
- Show the post-result warning about final confirmation.
- Open the appointment drawer from a selected slot.

Acceptance criteria:

- A manager can answer "who is free for this service on this day?" directly from the calendar page.
- Slot selection opens the existing booking flow with the expected prefilled data.

### Phase 4: Today UI

Goal: make the feature usable from the today page without awkward page state.

Tasks:

- Add the header trigger.
- Reuse the same drawer component.
- Handle success redirect when booking a different day.

Acceptance criteria:

- The today page supports the same availability workflow with date-prefill parity.
- Booking another day does not feel like a silent save.

### Phase 5: Tests and Polish

Goal: make the feature reliable enough for live manager use.

Tasks:

- Add unit tests for slot generation and nearest search.
- Add API tests for day and nearest modes.
- Add UI tests for:
  - service-required state
  - eligible staff filtering
  - empty-state reasons
  - nearest result action
  - slot-to-appointment handoff
- Review Persian copy for clarity and brevity.

Acceptance criteria:

- Core scheduling edge cases are covered.
- The manager flow is stable on mobile layouts.

## Testing Checklist

At minimum, cover these cases:

- specific staff with valid openings
- specific staff off that day
- any qualified staff with several eligible people
- any qualified staff where some are off and some are available
- any qualified staff where everyone is fully booked
- service duration fits at one slot boundary but not another
- today search after current time has passed early slots
- nearest search finding the same day later
- nearest search finding a later day
- nearest search returning nothing within one week
- staff with explicit schedule rows
- staff with no schedule rows using salon hours fallback
- inactive staff excluded
- service-ineligible staff excluded
- save succeeds after handoff
- save fails later because of client conflict

## Risks and Guardrails

### Risk: Lookup And Save Can Diverge

Because the manager may edit the appointment after selecting a suggested slot, or another booking may happen first, lookup is advisory until save succeeds.

Guardrail:

- Keep save-time validation authoritative.
- Use specific booking errors when possible.

### Risk: Client Conflict Is Not Checked In Lookup

This is an explicit v1 tradeoff.

Guardrail:

- Show the small warning after results appear.
- Keep backend save validation unchanged.

### Risk: Logic Drift Between Today/Calendar/Booking

If availability rules get duplicated, the UI may suggest times the booking flow rejects.

Guardrail:

- Centralize day and nearest logic behind one shared availability function.
- Reuse existing schedule and overlap helpers where possible.

## Non-Goals

Out of scope for this plan:

- customer self-booking
- public booking links
- saved searches
- analytics dashboards for availability usage
- phone-call logging
- notification workflows tied to lookup
- buffer-time modeling
- offline availability answers
- multi-client or grouped visit search

## Definition Of Done

This feature is done when:

- managers can launch availability lookup from both calendar and today
- they can search by service, date, and optional staff
- the app returns truthful bookable start times for the selected day
- empty states are specific and useful
- nearest availability works within the agreed one-week window
- tapping a suggestion hands off cleanly into the existing booking flow
- the booked result is visible or redirect-supported from today
- the implementation preserves current scheduling rules and does not fork them
