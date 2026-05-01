# Placeholder Booking Follow-Up Plan

## Summary

Finish the remaining PRD scope after the core placeholder flow: add manager-only Today attention for incomplete bookings, enforce the one-placeholder-one-appointment rule at the service layer, clean up incomplete placeholder cancellations deterministically, and polish offline conflict review for placeholder completion.

This plan assumes the first slice already shipped:

- manager-only placeholder creation from appointment flows
- placeholder completion with duplicate-phone reassignment support
- placeholder badge rendering in appointment surfaces
- baseline offline queueing for placeholder create and completion

The remaining work is mostly integrity and operational polish. The highest-risk gap is that placeholder lifecycle rules still live partly in routes and partly in UI behavior instead of one backend-owned module.

## Current Baseline

The repo already contains the core placeholder path:

- [packages/database/src/internal/placeholder-client-queries.ts](/Users/mohamad/Projects/aravira-saloon/packages/database/src/internal/placeholder-client-queries.ts) creates placeholders, completes them, handles duplicate-phone reassignment, and deletes orphan placeholders when there are no remaining appointments.
- [packages/database/src/internal/appointment-intake.ts](/Users/mohamad/Projects/aravira-saloon/packages/database/src/internal/appointment-intake.ts) validates client, staff, service, availability, and overlap, but does not yet enforce one-placeholder-one-appointment reuse rules.
- [apps/app/app/api/appointments/route.ts](/Users/mohamad/Projects/aravira-saloon/apps/app/app/api/appointments/route.ts) and [apps/app/app/api/appointments/[id]/route.ts](/Users/mohamad/Projects/aravira-saloon/apps/app/app/api/appointments/[id]/route.ts) already create placeholders and perform some orphan cleanup, but cancellation still behaves like a normal status patch.
- [packages/database/src/internal/today-queries.ts](/Users/mohamad/Projects/aravira-saloon/packages/database/src/internal/today-queries.ts) already builds Today attention items, but has no placeholder-specific attention rule.
- [packages/data-client/src/core/modules/appointments-module.ts](/Users/mohamad/Projects/aravira-saloon/packages/data-client/src/core/modules/appointments-module.ts), [packages/data-client/src/core/sync-process-pending.ts](/Users/mohamad/Projects/aravira-saloon/packages/data-client/src/core/sync-process-pending.ts), and [apps/app/components/manager-sync-bar.tsx](/Users/mohamad/Projects/aravira-saloon/apps/app/components/manager-sync-bar.tsx) already support offline placeholder completion conflicts, but review copy and deep links are still generic.

## Key Changes

- **Today attention**
  - Extend `TodayAttentionItem['type']` with `incomplete-client`.
  - Add a manager-only attention rule in `getTodayData` for appointments whose `client.isPlaceholder === true`.
  - Fire the rule for placeholder bookings that are operationally relevant now: same-day appointments, with higher urgency when the appointment is within the existing “soon” window.
  - Update the Today page attention label map and cards so incomplete-client items render as a distinct reminder, not as first-time/VIP/no-show noise.

- **Placeholder lifecycle enforcement**
  - Expand the placeholder lifecycle module so it owns:
    - validating whether a placeholder client may be referenced by an appointment
    - determining whether a placeholder is still valid after appointment mutation
    - orphan cleanup after delete/cancel/reassign
  - Enforce the product rule “one placeholder represents one appointment only” in the backend, not just the UI.
  - Allow an existing placeholder client to remain linked only to its current appointment during edits.
  - Reject any attempt to attach a placeholder client to a different appointment with `409` and machine code `placeholder-reuse`.

- **Cancellation cleanup**
  - Preserve PRD intent by treating manager cancellation of an incomplete placeholder booking as an exception cleanup path, not as long-lived cancelled placeholder history.
  - Default behavior: if a manager cancels a placeholder-backed appointment before completion, delete that appointment and then orphan-clean the placeholder client.
  - Apply the same rule in online route handling and offline sync replay so cancellation is deterministic in both modes.
  - Keep normal cancellation behavior unchanged for non-placeholder clients.

- **Offline review polish**
  - Keep the current offline mutation model, but improve review UX for placeholder-specific conflicts.
  - Distinguish generic appointment updates from `complete_placeholder_client` and placeholder-cancel cleanup rows when building review titles and copy.
  - For `duplicate-phone`, `placeholder-reuse`, and related placeholder conflicts, show manager copy that explains the exact recovery step and deep-link back to the calendar detail drawer for the affected appointment.
  - Do not introduce a new review surface; refine the existing sync sheet and reuse the appointment detail CTA.

## Public Interface / Type Changes

- Add `incomplete-client` to `TodayAttentionItem['type']` in [packages/salon-core/src/types.ts](/Users/mohamad/Projects/aravira-saloon/packages/salon-core/src/types.ts).
- Add backend conflict code `placeholder-reuse`.
- Extend the sync review item shape with optional metadata for:
  - `action`
  - `description`
  - `href`
  - `actionLabel`
- Keep the existing appointment and client route shapes unless needed for the new error code and richer sync review metadata.

## Implementation Plan

### Workstream 1: Centralize Placeholder Lifecycle Rules

Goal: move placeholder integrity decisions out of scattered route code and into one backend module.

Primary files:

- [packages/database/src/internal/placeholder-client-queries.ts](/Users/mohamad/Projects/aravira-saloon/packages/database/src/internal/placeholder-client-queries.ts)
- [packages/database/src/internal/appointment-intake.ts](/Users/mohamad/Projects/aravira-saloon/packages/database/src/internal/appointment-intake.ts)
- [packages/database/src/clients.ts](/Users/mohamad/Projects/aravira-saloon/packages/database/src/clients.ts)

Planned changes:

- Add a small lifecycle surface to the placeholder module, for example:
  - `validatePlaceholderClientUsage({ salonId, clientId, appointmentId? })`
  - `cleanupPlaceholderAfterAppointmentMutation({ salonId, previousClientId, nextClientId, deletedAppointmentId? })`
  - `cancelIncompletePlaceholderAppointment({ salonId, appointmentId })`
- Move the “may this placeholder be attached here?” check into appointment intake validation so both create and update paths share the same enforcement.
- Implement `placeholder-reuse` when:
  - the target client is a placeholder
  - the target client is already referenced by a different appointment
  - the current mutation is not simply editing that same linked appointment
- Keep reuse legal only for:
  - editing the already-linked appointment
  - completing the placeholder into a normal client
- Keep orphan deletion as a lifecycle concern, not a route-specific afterthought.

Acceptance criteria:

- a placeholder may be referenced by exactly one appointment
- editing that same appointment remains allowed
- reassigning another appointment to that placeholder returns `409 placeholder-reuse`
- delete, reassign, completion, and cancel cleanup all funnel through the same lifecycle helper

### Workstream 2: Make Cancellation Deterministic Cleanup

Goal: align the product behavior for incomplete placeholder cancellation across online and offline modes.

Primary files:

- [apps/app/app/api/appointments/[id]/route.ts](/Users/mohamad/Projects/aravira-saloon/apps/app/app/api/appointments/[id]/route.ts)
- [packages/data-client/src/core/modules/appointments-module.ts](/Users/mohamad/Projects/aravira-saloon/packages/data-client/src/core/modules/appointments-module.ts)
- [packages/data-client/src/core/sync-process-pending.ts](/Users/mohamad/Projects/aravira-saloon/packages/data-client/src/core/sync-process-pending.ts)
- [packages/data-client/src/core/modules/sync-module.ts](/Users/mohamad/Projects/aravira-saloon/packages/data-client/src/core/modules/sync-module.ts)

Planned changes:

- In the appointment PATCH route:
  - if manager sets `status: 'cancelled'`
  - and the linked client is still a placeholder
  - treat the request as cleanup: delete the appointment, then orphan-clean the placeholder
  - return success with a cleanup-shaped response that the app can treat as removed
- In the data client offline path:
  - when cancelling a placeholder-backed appointment, remove it locally immediately
  - also remove the local placeholder client snapshot when it becomes orphaned
  - enqueue a semantic appointment mutation row such as `action: 'cancel_incomplete_placeholder'` so replay is explicit
- In sync replay:
  - replay placeholder cancel cleanup through the appointment PATCH route with `{ status: 'cancelled' }`
  - preserve the same backend cleanup behavior as online mode
- In discard logic:
  - make sure dropping a failed placeholder-cancel row does not leave behind a zombie local placeholder record

Acceptance criteria:

- manager cancel on an incomplete placeholder booking removes the appointment instead of preserving cancelled history
- non-placeholder cancellations still remain normal status updates
- offline local state matches the eventual server state
- retry and discard behave predictably after placeholder-cancel conflicts

### Workstream 3: Add Manager-Only Today Attention

Goal: surface incomplete placeholder follow-up where it matters operationally, without leaking new duties into staff views.

Primary files:

- [packages/salon-core/src/types.ts](/Users/mohamad/Projects/aravira-saloon/packages/salon-core/src/types.ts)
- [packages/database/src/internal/today-queries.ts](/Users/mohamad/Projects/aravira-saloon/packages/database/src/internal/today-queries.ts)
- [apps/app/app/api/today/route.ts](/Users/mohamad/Projects/aravira-saloon/apps/app/app/api/today/route.ts)
- [apps/app/app/(app)/today/page.tsx](/Users/mohamad/Projects/aravira-saloon/apps/app/app/(app)/today/page.tsx)

Planned changes:

- Add `incomplete-client` to `TodayAttentionItem['type']`.
- In `getTodayData`, add a placeholder rule only when `staffIdFilter` is absent. That keeps it manager-only without adding another role flag to the type.
- Trigger the rule only for same-day active appointments whose client is still a placeholder.
- Priority policy:
  - within the existing soon window: `priority: 1`
  - otherwise same-day active placeholder: `priority: 2`
- Use reminder copy that reads as missing client completion work, not risk/marketing noise.
- Update Today grouping and labels so `incomplete-client` stands on its own.
- For placeholder attention CTA, prefer deep-linking to the calendar detail drawer over the client profile since placeholders are intentionally not part of the normal client roster.

Acceptance criteria:

- manager Today shows incomplete placeholder reminders
- staff Today data does not acquire those reminders
- placeholder reminders sort above lower-signal attention like first-time
- completed, cancelled, and non-placeholder appointments do not create this item

### Workstream 4: Polish Offline Review Metadata and Copy

Goal: make placeholder-related sync conflicts recoverable without guesswork.

Primary files:

- [packages/data-client/src/core/modules/sync-module.ts](/Users/mohamad/Projects/aravira-saloon/packages/data-client/src/core/modules/sync-module.ts)
- [packages/data-client/src/core/sync-http-error.ts](/Users/mohamad/Projects/aravira-saloon/packages/data-client/src/core/sync-http-error.ts)
- [packages/data-client/src/core/modules/appointments-module.ts](/Users/mohamad/Projects/aravira-saloon/packages/data-client/src/core/modules/appointments-module.ts)
- [apps/app/components/manager-sync-bar.tsx](/Users/mohamad/Projects/aravira-saloon/apps/app/components/manager-sync-bar.tsx)
- [apps/app/app/(app)/calendar/page.tsx](/Users/mohamad/Projects/aravira-saloon/apps/app/app/(app)/calendar/page.tsx)

Planned changes:

- Treat `placeholder-reuse` like the existing immediate conflict codes that should stop in review.
- Extend sync queue payload metadata for placeholder-sensitive rows so review UI can build meaningful copy:
  - appointment id
  - appointment date
  - action kind
  - placeholder client id when relevant
- Extend `SyncReviewItem` to include description and CTA metadata rather than forcing the UI to infer it from raw codes.
- Copy policy:
  - `duplicate-phone`: explain that the phone belongs to an existing client and the manager should reopen the appointment and choose reassignment
  - `placeholder-reuse`: explain that this placeholder is already tied to a different appointment and the manager should choose a normal client or create a new placeholder
  - placeholder cancel cleanup failure: explain that the removal could not be confirmed and the manager should reopen the appointment from calendar
- Deep-link appointment review items to `/calendar?date=YYYY-MM-DD&appointmentId=...` so the detail drawer opens directly.

Acceptance criteria:

- review rows for placeholder completion do not look like generic appointment updates
- placeholder conflicts include a concrete recovery instruction
- the review CTA lands on the calendar detail drawer for the affected appointment

## Execution Order

1. Refactor placeholder lifecycle helpers in the database package.
2. Wire intake validation to enforce `placeholder-reuse`.
3. Update online appointment PATCH cancellation behavior.
4. Update offline appointment cancellation semantics and sync replay.
5. Add Today attention type and manager-only rule.
6. Upgrade sync review metadata and manager copy.
7. Add tests for each layer before doing final integration verification.

This order keeps the integrity rules first. The UI polish depends on stable backend and sync semantics, so it should land after the lifecycle behavior is settled.

## Edge Cases To Preserve

- Placeholder edit on the same appointment is valid and must not trip reuse protection.
- Completing a placeholder into a normal client must clear future reuse restrictions because the client is no longer a placeholder.
- Placeholder duplicate-phone reassignment must still delete the orphan placeholder if no appointments remain.
- Staff users can continue to see the appointment name in schedule views, but they must not receive placeholder cleanup reminders or actions.
- Today attention for placeholder clients should only apply to active same-day work, not future bookings days away.
- Offline retry after a placeholder conflict should keep enough metadata to route the manager back to the right appointment.

## Test Plan

- **Placeholder lifecycle tests**
  - placeholder create -> appointment create -> valid single use
  - placeholder edit on the same appointment -> allowed
  - placeholder attach to a different appointment -> rejected with `placeholder-reuse`
  - complete placeholder with unique phone -> converted to normal client
  - complete placeholder with duplicate phone -> reassignment path works
  - delete placeholder-backed appointment -> orphan placeholder removed
  - cancel placeholder-backed appointment -> appointment removed and placeholder removed

- **Today attention tests**
  - same-day placeholder appointment creates `incomplete-client` attention
  - soon placeholder appointment gets higher-priority attention
  - completed/cancelled/non-placeholder appointments do not create the new attention item
  - staff-filtered Today data does not add manager-only placeholder review responsibilities

- **Offline/data-client tests**
  - offline placeholder completion replay with duplicate-phone conflict enters review with placeholder-specific metadata and copy
  - offline placeholder reuse conflict enters review with placeholder-specific recovery copy
  - offline manager cancel of placeholder booking replays as cleanup semantics
  - offline discard/retry paths remove or preserve local placeholder records correctly

- **Route/integration tests**
  - appointment PATCH cancel for placeholder-backed booking performs cleanup behavior
  - appointment create/update using another appointment’s placeholder client returns `409 placeholder-reuse`

## Suggested Test Locations

- add new focused tests under `packages/database/src/internal/` for placeholder lifecycle and intake validation
- add or extend data-client tests around:
  - [packages/data-client/src/create-data-client.test.ts](/Users/mohamad/Projects/aravira-saloon/packages/data-client/src/create-data-client.test.ts)
  - [packages/data-client/src/core/mutation-queue.test.ts](/Users/mohamad/Projects/aravira-saloon/packages/data-client/src/core/mutation-queue.test.ts)
  - new sync module or appointments module tests beside the existing core tests
- extend app route coverage alongside [apps/app/app/api/tenant-isolation.test.ts](/Users/mohamad/Projects/aravira-saloon/apps/app/app/api/tenant-isolation.test.ts) if that remains the current API integration pattern

## Risks / Watchouts

- The main risk is split lifecycle logic between route handlers and the placeholder module. If cleanup logic is copied instead of centralized, online and offline behavior will drift again.
- The Today attention rule should not be implemented purely in the client because offline Today snapshots already hydrate from the server shape.
- Placeholder cancel cleanup needs careful response handling because the current PATCH flow expects an updated appointment, while cleanup semantics really remove the appointment.
- Sync discard logic needs special care for locally created placeholder clients so we do not strand invisible placeholder rows in IndexedDB.

## Assumptions

- For incomplete placeholder bookings, cancel should behave like cleanup, not retained cancelled history. This is the default chosen to satisfy the PRD with the current schema.
- Placeholder appointments remain manager-only operational exceptions; staff views should keep showing appointments normally without new cleanup actions.
- Offline conflict resolution should stay inside the current sync sheet plus calendar/detail surfaces, not a new dedicated review workflow.
