# Mobile-First UX/UI Improvement Plan for Aravira App

## Summary

The current app already has solid role separation and PWA groundwork, but the mobile experience is still screen-driven rather than task-driven. The biggest gaps are overloaded manager navigation, a calendar workflow that stays dense on phones, and several touch/accessibility issues that add friction during real salon work.

## Implementation Progress

### Phase 1 - Completed

- Added role-aware entry routing so managers land on `/today` and staff land on `/calendar` from both the app root and login.
- Simplified manager bottom navigation from 6 items to 4 mobile-first items: `Today`, `Calendar`, `Clients`, and `More`.
- Turned the manager settings screen into a clearer More/management hub by surfacing dashboard, retention, staff, and onboarding links together.
- Made mobile calendar controls more touch-friendly with 44px header buttons, a day-view default on small screens, larger view toggles, and clearer staff filter chips with an explicit all-staff state.
- Enabled staff quick appointment status actions for their own appointments only: confirm, complete, and no-show. Full appointment edit/delete/cancel remains manager-only.
- Improved mobile drawer ergonomics with input repositioning enabled by default, contained overscroll, larger bottom-sheet height, rounded mobile sheet styling, and safe-area-aware footers.
- Removed the mobile `autoFocus` from inline client creation and converted client list rows from clickable `div` navigation to semantic full-row links.
- Added accessible labels for icon-only staff action buttons and client overflow actions.
- Verified with `pnpm --filter @repo/app typecheck` and `pnpm --filter @repo/app lint`.
- Visually tested the Phase 1 mobile flows with Playwright on an iPhone-sized viewport: manager `/today`, manager More hub, manager calendar controls, client list links, staff calendar, and staff appointment status action.
- Created and deleted a temporary appointment during Playwright validation to confirm staff can update their own appointment status and cannot access manager-only create/delete flows from the UI.
- Updated the existing critical-flow E2E expectations to match the new manager `/today` landing and More-hub navigation model.
- Added consistent back buttons to manager secondary headers (`Dashboard`, `Retention`, `Staff`) and unlocked onboarding, routing users back to the More hub without changing primary bottom-nav pages.
- Added a shared Persian digit/localized-number helper and applied it across visible phone, time, duration, price, date, and count displays in the app shell and key mobile forms.
- Converted phone/numeric inputs away from native English-number presentation where needed: user input can still be typed in Latin or Persian, but the UI displays Persian digits and submits normalized Latin digits to APIs.
- Replaced remaining user-facing `...` loading/placeholder copy with the Persian-friendly ellipsis `…`.
- Refreshed Playwright mobile screenshots for login Persian phone entry, More/settings number inputs, and secondary-page back-button headers.

### Remaining Phases

- Phase 2: Redesign `/today` into the full manager operational workbench with attention queue first, active appointments second, and summary metrics third.
- Phase 3: Rework appointment create/edit into a progressive mobile flow with clearer steps and confirmation.
- Phase 4: Redesign retention, client detail, staff, and settings forms into single-column mobile-first cards with stronger one-thumb actions.
- Phase 5: Add mobile viewport screenshot/e2e coverage for iPhone SE and modern iPhone sizes.
- Later hardening: add an automated locale regression test that asserts phone/numeric fields render Persian digits after typing Latin digits.

## Audit Findings

- [apps/app/components/bottom-nav.tsx](/Users/mohamad/Projects/aravira-saloon/apps/app/components/bottom-nav.tsx:16) and [apps/app/components/bottom-nav.tsx](/Users/mohamad/Projects/aravira-saloon/apps/app/components/bottom-nav.tsx:50) - manager mobile nav exposes 6 primary destinations with `11px` labels, which is too crowded for one-thumb phone use and dilutes the main action for managers.
- [apps/app/app/login/page.tsx](/Users/mohamad/Projects/aravira-saloon/apps/app/app/login/page.tsx:42) and [apps/app/app/(app)/dashboard/page.tsx](/Users/mohamad/Projects/aravira-saloon/apps/app/app/(app)/dashboard/page.tsx:128) - staff log in to `/dashboard` and then get redirected to `/calendar`, creating an unnecessary wrong-screen step on mobile.
- [apps/app/components/calendar/calendar-header.tsx](/Users/mohamad/Projects/aravira-saloon/apps/app/components/calendar/calendar-header.tsx:68), [apps/app/app/(app)/calendar/page.tsx](/Users/mohamad/Projects/aravira-saloon/apps/app/app/(app)/calendar/page.tsx:83), and [apps/app/app/(app)/calendar/page.tsx](/Users/mohamad/Projects/aravira-saloon/apps/app/app/(app)/calendar/page.tsx:406) - calendar defaults to `week`, uses small 32px header controls, and stacks view toggles plus staff filters into a dense control bar that is hard to scan on phones.
- [apps/app/components/calendar/staff-filter.tsx](/Users/mohamad/Projects/aravira-saloon/apps/app/components/calendar/staff-filter.tsx:35) - staff filter chips hide names on mobile and rely on tiny avatar pills, which weakens recognition and makes multi-staff filtering error-prone.
- [apps/app/app/(app)/clients/page.tsx](/Users/mohamad/Projects/aravira-saloon/apps/app/app/(app)/clients/page.tsx:182) - client row navigation is implemented as a clickable `div` instead of a link, which is a weaker semantic/touch pattern than a full-row link/card.
- [apps/app/components/calendar/client-picker.tsx](/Users/mohamad/Projects/aravira-saloon/apps/app/components/calendar/client-picker.tsx:262) and [packages/ui/src/drawer.tsx](/Users/mohamad/Projects/aravira-saloon/packages/ui/src/drawer.tsx:49) - mobile sheets/forms still use `autoFocus` and the shared drawer lacks baked-in mobile sheet behavior like contained overscroll and safe-area-aware footer defaults.
- [apps/app/app/(app)/today/page.tsx](/Users/mohamad/Projects/aravira-saloon/apps/app/app/(app)/today/page.tsx:167), [apps/app/app/(app)/retention/page.tsx](/Users/mohamad/Projects/aravira-saloon/apps/app/app/(app)/retention/page.tsx:105), and [apps/app/app/(app)/settings/page.tsx](/Users/mohamad/Projects/aravira-saloon/apps/app/app/(app)/settings/page.tsx:191) - several manager pages still compress important data into 2-column mobile grids, which reduces readability and prioritization under real-world usage.

## Key Changes

- Reframe mobile IA around roles.
- Make manager mobile home operations-first by routing managers to a redesigned `/today` surface after login and positioning dashboard analytics as a secondary destination.
- Keep staff schedule-first, with `/calendar` as home, but add quick appointment actions and client reachability without expanding staff into full manager tooling.
- Reduce manager bottom nav to 4 primary items: `Today`, `Calendar`, `Clients`, `More`.
- Move `Retention`, `Dashboard`, `Staff`, and `Settings` into a manager More/Manage hub with grouped task cards rather than equal-weight bottom-nav tabs.
- Keep staff bottom nav to 2-3 items max: `Today/Schedule`, `Calendar`, `Settings` if a separate staff agenda screen is added; otherwise `Calendar` and `Settings` with quick actions embedded in calendar/detail views.

- Redesign the calendar for phones first.
- Default mobile calendar to a day agenda view for staff and a today/day view for managers; keep week/month/list as secondary modes selected from a bottom sheet or compact segmented control.
- Replace the current header with 44px minimum tap targets, a stronger current-date affordance, and a clearer hierarchy between date navigation and view switching.
- Convert staff filtering from tiny inline pills into either larger labeled chips or a filter sheet with explicit selected counts and all-staff state.
- Replace the floating plus button with an extended mobile action pattern: either a labeled FAB or sticky bottom action bar when managers can create appointments.
- Make appointment create/edit flows progressive: client, service/staff, date/time, notes/status, then confirmation; keep the footer sticky and safe-area-aware.

- Improve manager operational flows.
- Redesign `/today` as the primary manager workbench: attention queue first, active appointments second, summary metrics third.
- Rework retention cards into stronger one-thumb action rows with a single primary CTA and secondary overflow actions.
- Convert client list and client detail into clearer mobile cards/full-row links, with prominent phone, next appointment, and follow-up actions.
- Reflow settings and staff management forms to single-column mobile layouts by default; avoid side-by-side time inputs and secondary hidden labels on small widths.

- Establish a shared mobile design system pass.
- Add mobile shell rules for safe areas, sticky headers/footers, drawer overscroll containment, larger tap targets, and one-thumb spacing.
- Standardize RTL mobile typography, card density, action hierarchy, empty states, and offline banner placement.
- Remove mobile-hostile patterns such as `autoFocus` in sheets, `...` placeholders, tiny unlabeled controls, and non-link navigation containers.

## Public Interfaces / Structural Changes

- Add a role-aware post-login redirect contract so auth can send managers and staff to different default mobile homes without route bouncing.
- Introduce a shared mobile navigation config per role instead of hard-coded equal-weight tabs.
- Extend shared drawer/sheet primitives with mobile defaults for safe-area footer padding, overscroll containment, and optional sticky action regions.
- Add reusable mobile list-row and quick-action card patterns for clients, appointments, retention items, and staff records.

## Test Plan

- Manager login lands directly on the new operations-first mobile home; staff login lands directly on their schedule flow.
- iPhone SE / iPhone 14 width snapshots confirm no clipped bottom-nav labels, no cramped view controls, and no hidden critical actions.
- Calendar interactions work with one hand: change date, switch view, filter staff, open appointment, create appointment.
- Staff can confirm, complete, and mark no-show from mobile without visiting manager-only screens.
- Client list/detail and retention flows remain fully reachable with semantic links/buttons and visible focus states.
- Drawer-based forms respect safe areas, do not auto-focus on mobile, and remain scroll-stable with the keyboard open.
- Offline/network banners still appear correctly and do not cover primary actions.

## Assumptions

- Manager mobile priority is `Operations First`.
- Staff mobile scope is `Schedule + Quick Actions`, not full client/staff administration.
- The redesign should preserve the existing Persian/RTL salon brand tone and evolve it, not replace it with a totally new visual identity.
