# Aravira PWA Mobile Readiness Plan

## Context

Aravira already has the core ingredients of an installable PWA:

- A valid web app manifest.
- Standalone display mode and portrait orientation.
- App icons and maskable icons.
- A production-only service worker registration flow.
- A mobile-first shell with safe-area handling, full-height layouts, touch-friendly buttons, and bottom navigation.
- Install prompt UX for Android and install guidance for iOS Safari.

That means the app is no longer at the "can this even be installed?" stage. It is already installable.

The next step is different: make the installed app feel trustworthy, fast, resilient, and intentional on real phones used daily by salon managers and staff.

This plan focuses on turning the current implementation into a production-grade mobile-first PWA.

## Product Goal

Position Aravira as:

> A mobile-first salon operations app that users can install on their phones and rely on every day for scheduling, client management, staff workflows, and timely notifications.

The goal is not just browser compatibility.

The goal is:

- Fast first load.
- Smooth installed-app behavior.
- Good offline and flaky-network handling.
- Reliable updates.
- Strong home-screen presence.
- Comfortable one-handed mobile use.

## Current Assessment

### Already Working

- Manifest exists with `standalone`, `portrait`, app icons, and shortcuts.
- Service worker exists and is now disabled in development.
- Production service worker update flow exists.
- The app shell is largely mobile-oriented.
- The calendar and bottom navigation are already designed around phone usage.

### Main Gaps

- Offline support is minimal and mostly limited to static assets.
- The current service worker cache strategy is too broad and should be made safer and more deliberate for production updates.
- Manifest screenshots are empty, which weakens install UX on supporting platforms.
- iOS installed-app polish is incomplete.
- Mobile performance has not been validated against real user flows.
- There is no documented release checklist for PWA-specific regressions.

## Success Criteria

Aravira is "PWA mobile ready" when all of the following are true:

- Users can install the app reliably on Android and iOS-supported flows.
- The installed app launches cleanly with proper iconography, theme color, and app-shell behavior.
- Important screens remain usable under slow or intermittent connectivity.
- Updates do not break the installed app or trap users on stale assets.
- Core mobile flows feel intentionally optimized for touch and small screens.
- Push notifications, notification click handling, and app return flows work reliably.
- The team has a repeatable validation checklist before release.

## Non-Goals For This Phase

- Full offline write support for every entity in the product.
- Native-app parity for all device features.
- Rebuilding the product as React Native or Expo.
- Complex background sync before the offline model is defined.

## Phase 1: Stabilize PWA Runtime

Goal: make the installed app safe and predictable.

Tasks:

- Replace the current broad cache-first strategy with a more deliberate cache plan.
- Avoid long-lived caching of dynamic app code unless the update strategy is proven safe.
- Keep HTML navigations network-first.
- Keep service worker versioning explicit and easy to bump.
- Ensure service worker activation and update handling cannot leave users on a broken bundle.
- Review cache naming, cleanup, and fallback logic.

Acceptance criteria:

- A production deploy does not cause stale chunk failures for installed users.
- A new deploy updates cleanly with a clear and tested refresh path.
- Service worker behavior is documented for the team.

## Phase 2: Improve Offline And Poor-Network Experience

Goal: the app should degrade gracefully on real phones.

Tasks:

- Define which routes should have offline fallbacks.
- Add route-aware offline states instead of one generic offline HTML page only.
- Decide which read-only data can be cached safely for short-term use.
- Show clear in-app messaging when data is stale, unavailable, or reconnecting.
- Add retry and refresh UX for key screens like calendar, today, and clients.
- Decide whether appointment lists and recent client data should be available in limited offline mode.

Acceptance criteria:

- Users get understandable offline behavior on the most important screens.
- The app remains useful when the network is weak, not only when it is perfect.

## Phase 3: Strengthen Installability And Home-Screen Presence

Goal: make installation feel polished and intentional.

Tasks:

- Add real screenshots to the manifest for install surfaces that support them.
- Audit all icon outputs for sharpness, padding, and maskable safety zones.
- Verify `apple-touch-icon` behavior on iOS.
- Review app name, short name, theme color, and background color for launcher quality.
- Refine the install prompt timing so it feels helpful rather than intrusive.
- Decide whether install education should appear only after a value moment instead of first visit.

Acceptance criteria:

- The install card/store-like experience looks complete.
- Home-screen icon quality is consistent across Android and iOS.
- Install prompt UX feels product-driven, not generic.

## Phase 4: Finish iOS Installed-App Polish

Goal: make the iPhone/iPad experience feel closer to a real app.

Tasks:

- Revisit Apple web app metadata and startup image strategy.
- Verify status bar appearance, viewport behavior, and safe-area layout on notched devices.
- Review keyboard resizing and input ergonomics in standalone mode.
- Test all major flows in iOS Safari and iOS installed mode separately.
- Confirm modal, drawer, and bottom-sheet behavior with the on-screen keyboard.

Acceptance criteria:

- Installed iOS behavior is predictable across login, calendar, appointment editing, and settings.
- Safe-area spacing and keyboard interactions feel correct on current iPhone sizes.

## Phase 5: Mobile UX Pass On Core Screens

Goal: turn "responsive enough" into "mobile first."

Priority screens:

- Login
- Signup
- Dashboard
- Calendar
- Today
- Clients
- Client detail
- Settings
- Appointment create/edit drawers

Tasks:

- Check tap target sizes and one-handed reach.
- Reduce visual density where content is too desktop-like.
- Make primary actions obvious and thumb-friendly.
- Audit sticky headers, floating buttons, and bottom-nav overlap.
- Validate drawer and modal heights with safe-area padding.
- Review typography and spacing for small Persian text on mobile.
- Ensure loading, empty, and error states are readable on narrow screens.

Acceptance criteria:

- Each priority screen has an explicit mobile UX review.
- No key flow requires pinch-zoom or awkward horizontal scrolling.

## Phase 6: Performance Pass

Goal: make the installed app feel fast on mid-range phones.

Tasks:

- Measure production bundle and route payload sizes.
- Audit heavy screens, especially calendar-related bundles.
- Reduce unnecessary client-side work in app shell and high-traffic routes.
- Review font loading impact and critical CSS behavior.
- Validate image optimization strategy for installed-app usage.
- Check SWR refresh patterns on mobile networks and battery-sensitive usage.
- Profile startup cost after installation and after a cold launch.

Acceptance criteria:

- Performance budgets are defined for app shell, calendar route, and dashboard route.
- The team can identify the most expensive mobile entry points.

## Phase 7: Push Notification Reliability

Goal: notifications should drive users back into the right workflow reliably.

Tasks:

- Validate push subscription flow end to end on supported devices.
- Confirm notification icon, badge, title, and body quality.
- Improve deep-link routing from notification clicks.
- Decide which notifications are high-value and should exist in the first mobile release.
- Handle revoked permissions and failed subscriptions cleanly.

Acceptance criteria:

- Notification tap opens the correct in-app destination reliably.
- Permission and subscription state are visible and understandable to users.

## Phase 8: Release Checklist And QA Matrix

Goal: avoid shipping PWA regressions accidentally.

Create a release checklist covering:

- Manifest validity.
- Service worker update path.
- Install flow on Android Chrome.
- Install flow on iOS Safari.
- Offline fallback behavior.
- Push notification opt-in and notification click flow.
- Safe-area checks on modern iPhone and Android devices.
- Keyboard behavior on login, signup, and appointment forms.
- Cold launch and relaunch from home screen.

Recommended QA device matrix:

- iPhone with notch, recent iOS.
- Android Chrome on a mid-range device.
- One larger-screen device or tablet.

Acceptance criteria:

- PWA-specific QA becomes a standard part of release validation.

## Suggested Execution Order

Recommended order:

1. Stabilize service worker runtime and update strategy.
2. Improve offline and weak-network behavior.
3. Complete installability polish and manifest assets.
4. Run a dedicated mobile UX pass on priority screens.
5. Do a focused performance pass.
6. Validate push notifications end to end.
7. Write and adopt the release checklist.

## Risks

- Over-caching can break installed users after deployment.
- Offline support can become misleading if stale data is shown without clear messaging.
- iOS behavior may differ significantly from Android, especially around install prompts and viewport/keyboard behavior.
- FullCalendar may remain one of the largest and most fragile mobile surfaces.

## Deliverables

This phase should produce:

- A safer service worker strategy.
- Manifest and launcher asset improvements.
- Better offline and reconnect UX.
- A reviewed mobile UX across key screens.
- Performance findings and targeted fixes.
- Push notification validation notes.
- A PWA/mobile release checklist.

## Definition Of Done

This plan is complete when Aravira can be honestly described as:

> A mobile-first installed web app for salon teams, with reliable updates, polished install UX, safe offline behavior, and validated core workflows on real phones.
