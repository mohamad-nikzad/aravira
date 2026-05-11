# Phased Port Of Web Features To Native

## Summary

Port all `apps/app` features to `apps/native` except offline/PWA support. The port is phased so each milestone leaves the native app usable and testable, with shared API coverage expanded before native screens depend on it.

## Phase 1: Shared API Foundation

- Expand `packages/api-client` to cover missing web API routes:
  - dashboard, onboarding, retention, business settings
  - client get/update/summary/follow-up
  - service create/update/get
  - staff create, staff services, staff schedule, booking availability
  - appointment get/update/delete, availability, complete placeholder client
- Keep bearer-token native auth as the only native session mechanism.
- Add mocked-fetch unit tests for every new API module.
- Acceptance: native can import typed APIs for every planned feature with no raw feature-specific `fetch` needed.

## Phase 2: Native Signup, Settings, And Core Manager Setup

- Replace native signup web handoff with full native salon signup using `/api/auth/signup`.
- Upgrade Settings/More with:
  - user profile card, logout, theme toggle
  - manager links to Dashboard, Retention, Onboarding, Staff
  - business hours editor
  - service list, create service, edit service, active/inactive state
- Port onboarding enough to configure salon profile confirmation, business hours, first service, first staff, and completion/reopen actions.
- Acceptance: a new manager can create a salon, finish setup, edit services/business hours, and log out/in from native.

## Phase 3: Clients And Retention

- Upgrade Clients list with create/edit client modal, tags, notes, phone formatting, call action, and empty/error states.
- Add `/clients/[id]` native profile:
  - stats, notes, tags, upcoming appointment, open follow-ups, appointment history
  - edit client, call, and "new appointment for this client"
- Port Retention queue:
  - item cards, suggested reason, call action, profile navigation, appointment creation handoff
  - reviewed/dismissed updates
- Acceptance: manager can manage client records, inspect a profile, and process retention tasks end to end.

## Phase 4: Calendar And Appointment Parity

- Load real business hours in native calendar instead of static fallback.
- Add appointment availability search with day/nearest modes and slot-to-create handoff.
- Extend appointment creation to support prefilled `date`, `time`, `clientId`, `staffId`, and `serviceId`.
- Upgrade appointment detail sheet with:
  - edit appointment
  - delete appointment
  - status transitions
  - complete placeholder client
  - phone action, notes, conflict/error handling
- Support native route params for `date`, `clientId`, and `appointmentId`.
- Acceptance: every appointment workflow available on web works in native without offline behavior.

## Phase 5: Today, Staff, Dashboard, And Push

- Upgrade Today:
  - manager quick actions for create appointment, availability search, calendar date, and client profile
  - staff/manager status mutation feedback and error states
- Upgrade Staff management:
  - create staff
  - assign allowed services, including unrestricted mode
  - edit weekly schedule with "use salon hours for all"
- Port Dashboard:
  - summary cards, status breakdowns, popular services, staff load, revenue, new clients
- Add native push settings for staff using native notifications, not web push/PWA APIs.
- Acceptance: manager reporting and staff administration reach web parity; staff can use today/calendar/settings flows from native.

## Phase 6: Verification And Polish

- Run:
  - `pnpm --filter @repo/api-client typecheck`
  - `pnpm --filter @repo/native typecheck`
  - `pnpm --filter @repo/native lint`
  - affected web/API tests, especially tenant isolation, appointments, clients, staff, onboarding
- Manual Expo verification:
  - manager signup/login/onboarding
  - service/business hours/staff setup
  - dashboard and retention
  - client create/edit/profile
  - appointment create/edit/delete/status/availability/placeholder completion
  - staff login, today actions, calendar status updates, push settings
- Polish RTL spacing, safe areas, loading/error states, keyboard behavior, and modal dismissal consistency.

## Assumptions

- "Skip offline support" excludes IndexedDB, PWA install/service worker/offline banners, offline snapshots, sync bar, and queued mutations.
- Native push notifications are included unless they should also be skipped.
- Backend remains the existing Next API in `apps/app/app/api`.
- No database migration is expected unless native push requires a different subscription shape.
