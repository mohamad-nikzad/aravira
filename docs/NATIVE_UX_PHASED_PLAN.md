# Native UX Phased Improvement Plan

## Purpose

Improve `apps/native` UX quality in focused phases. Each phase targets one area so the app remains usable, reviewable, and shippable after every milestone.

The plan is based on the native app audit and the `ui-ux-pro-max` mobile guidance:

- accessibility first
- touch targets at 44pt minimum
- consistent modal/sheet behavior
- keyboard-safe forms
- predictable navigation and back behavior
- token-driven light/dark styling
- clear loading, empty, and error feedback
- performant lists and calendar surfaces

No backend, database, or API contract changes are expected.

## Decisions

- Use current dependencies only for the first pass.
- Do not add a bottom-sheet library.
- Do not add a keyboard library unless later device testing proves React Native primitives are insufficient.
- Keep component-driven modal flows for now; do not move flows into Expo Router modal routes in this pass.
- Use shared native primitives instead of duplicating modal, form, list, and state UI per screen.
- Keep the custom calendar timeline/grid implementation, but improve its accessibility, touch behavior, and styling discipline.

## Phase 1: UX Foundation And Guardrails

Area: design-system and quality guardrails.

Outcome: the native UX rules are explicit and enforceable before broad UI changes begin.

Tasks:

1. Document modal, sheet, form, list, touch-target, and loading/error conventions in this plan.
2. Treat `apps/native/theme/*` as the source for semantic colors, radii, typography, states, and surfaces.
3. Fix or account for current `pnpm --filter @repo/native style:check` failures instead of refreshing the baseline to hide drift.
4. Remove new raw color usage from native screens and components, especially:
   - `apps/native/app/(tabs)/calendar.tsx`
   - `apps/native/app/dashboard.tsx`
   - picker and sheet components using `#000000` scrims
5. Replace ad-hoc radii in calendar/dashboard surfaces with theme radius tokens.
6. Replace legacy React Native shadow/elevation usage with the app's native shadow/elevation token approach.
7. Keep Persian/RTL and light/dark mode behavior as first-class acceptance criteria for every later phase.

Acceptance:

- `pnpm --filter @repo/native style:check` has no new unaccepted drift.
- New UX primitives and migrated screens use theme tokens for colors, radius, font families, and states.
- No new raw hex/rgb colors are added outside theme/token files.

## Phase 2: Shared Modal And Sheet System

Area: modal and sheet consistency.

Outcome: every modal and sheet has the same visual rhythm, safe-area behavior, dismissal model, keyboard handling, and accessibility contract.

Tasks:

1. Add shared primitives under `apps/native/components/ui/`:
   - `AppSheet`
   - `AppModal`
   - `ModalHeader`
   - `ModalFooter`
2. `AppSheet` should own:
   - transparent React Native `Modal`
   - consistent scrim opacity for light and dark mode
   - bottom placement
   - top grab handle
   - max height
   - safe-area bottom padding
   - Android back handling through `onRequestClose`
   - optional outside-tap dismissal
3. `AppModal` should own:
   - full/page-style modal shell
   - safe-area header
   - scrollable body
   - optional sticky footer
   - optional keyboard-aware layout
4. Migrate short/contextual flows to `AppSheet`:
   - `components/ui/select.tsx`
   - `components/ui/time-picker.tsx`
   - `components/ui/jalali-date-picker.tsx`
   - `components/calendar/client-picker.tsx`
   - `components/calendar/appointment-sheet.tsx`
   - client, service, staff, staff services, and staff schedule sheets if kept as bottom sheets
5. Migrate longer task flows to `AppModal`:
   - `components/calendar/appointment-create-modal.tsx`
   - `components/calendar/appointment-edit-modal.tsx`
   - `components/calendar/complete-client-modal.tsx`
   - `components/calendar/availability-modal.tsx`
6. Define dismissal rules:
   - simple pickers may close on backdrop tap
   - dirty forms require explicit close/cancel or confirmation
   - destructive actions are never hidden behind backdrop dismissal

Acceptance:

- All modal/sheet surfaces share the same scrim, radius, handle, header, close affordance, and footer spacing.
- Android hardware back matches visible close/cancel behavior.
- Dirty form dismissal asks for confirmation before losing user input.
- All close controls have accessible labels and at least 44pt touch area.

## Phase 3: Forms And Keyboard Safety

Area: form UX, keyboard avoidance, and submit visibility.

Outcome: form fields and primary CTAs remain visible and usable while the keyboard is open, especially on login and signup.

Tasks:

1. Add `KeyboardAwareFormScreen` for auth and standalone form screens.
2. Replace the centered auth layout in:
   - `apps/native/app/login.tsx`
   - `apps/native/app/signup.tsx`
3. Auth form behavior:
   - keep focused field visible above keyboard
   - keep submit action reachable
   - use `KeyboardAvoidingView` on iOS
   - use `keyboardShouldPersistTaps="handled"`
   - use iOS `automaticallyAdjustKeyboardInsets` where appropriate
   - add bottom inset for submit area and home indicator
   - avoid relying on `justifyContent: 'center'` for small screens
4. Extend shared form primitives:
   - `Input` supports focused and error states
   - `FormTextField` supports refs, `returnKeyType`, `onSubmitEditing`, `submitBehavior`, and password visibility toggle
   - `FormRootError` remains near the submit area
5. Normalize field behavior:
   - phone fields use phone keyboard and autofill hints
   - password fields use password autofill hints and visibility toggle
   - numeric fields use numeric keyboard and localized display where needed
   - validation errors render inline below the related field
6. On submit failure, focus the first invalid field where practical.

Acceptance:

- On small iOS and Android devices, typing in the login password field does not hide the password field or login button.
- Signup remains usable with the keyboard open on the last field.
- All required form fields have visible labels, inline errors, disabled states, and submit feedback.

## Phase 4: Touch Targets And Accessibility

Area: interaction ergonomics and screen reader semantics.

Outcome: all controls are easy to tap and understandable to assistive technologies.

Tasks:

1. Update `Button` defaults so normal and icon buttons provide at least 44pt touch targets.
2. Add a shared icon-button pattern or helper for small visual icons with expanded `hitSlop`.
3. Audit and fix touch targets in:
   - bottom navigation
   - calendar day/week/month headers
   - appointment blocks
   - modal close buttons
   - picker options
   - client/staff/service rows
   - dashboard back buttons
4. Add missing accessibility metadata:
   - `accessibilityRole`
   - `accessibilityLabel`
   - `accessibilityHint` when outcome is not obvious
   - `accessibilityState` for selected, disabled, expanded, and checked controls
5. Ensure custom checkboxes, chips, badges used as filters, FABs, and status controls announce their state.
6. Avoid gesture-only critical actions. Long press may remain a shortcut only when a visible action path also exists.

Acceptance:

- No primary or destructive action has a touch target below 44pt.
- Screen reader labels make row actions, status changes, and picker options understandable.
- Disabled controls are both visually and semantically disabled.

## Phase 5: Lists And Scroll Performance

Area: list performance and scroll behavior.

Outcome: growing data views mount quickly, scroll smoothly, and preserve safe-area behavior.

Tasks:

1. Convert growing `ScrollView + map` screens to `FlatList` or `SectionList`:
   - clients list
   - staff list
   - services list
   - notifications list/sections
   - retention queue
   - agenda view
   - long today appointment sections
2. Keep custom `ScrollView` only where layout depends on manual time-grid geometry:
   - day view
   - week view
   - month grid if the grid remains small and fixed
3. Add stable `keyExtractor`, memoized row components, and stable callbacks for list rows.
4. Use `contentInsetAdjustmentBehavior="automatic"` and bottom content insets where lists coexist with bottom nav or FABs.
5. Keep stale data visible during refresh when possible; avoid full blank resets on background reload.
6. Use pull-to-refresh only on screens where refresh is useful and expected.

Acceptance:

- Clients, staff, services, notifications, retention, and agenda screens do not mount all rows up front.
- Large lists remain smooth with realistic salon data.
- Bottom nav and FABs do not obscure final list items.

## Phase 6: Loading, Empty, Error, And Offline Feedback

Area: system feedback and recovery paths.

Outcome: every async screen communicates what is happening and gives the user a next action.

Tasks:

1. Add shared feedback primitives:
   - `AppLoadingState`
   - `AppEmptyState`
   - `AppErrorState`
   - `AppListState`
2. Standardize first-load skeletons for:
   - today
   - calendar
   - clients
   - staff
   - services
   - dashboard
   - notifications
   - retention
   - onboarding
3. Standardize empty states with a useful next action where possible:
   - create first client
   - create first service
   - create first staff member
   - create appointment
   - adjust date/filter
4. Standardize error states with retry actions and human recovery copy.
5. Improve `useAsyncResource` usage patterns so screens can distinguish:
   - initial loading
   - background refresh
   - stale data with error
   - empty success
6. Avoid `Alert.alert` for routine network errors when an inline retry state is better.

Acceptance:

- No major screen shows only blank space during load, empty data, or recoverable failure.
- Retry is available for failed data loads.
- Background refresh does not unnecessarily replace existing data with skeletons.

## Phase 7: Calendar UX

Area: calendar-specific readability, interaction, and scheduling confidence.

Outcome: the calendar remains dense enough for salon operations while becoming easier to tap, scan, and trust.

Tasks:

1. Improve day and week time-grid tap affordance:
   - larger effective slot hit zones
   - clearer accessible labels for adding appointments at a time
   - no accidental conflict with vertical scroll
2. Improve week and month date headers:
   - at least 44pt touch zones
   - clearer selected/today styling
   - avoid relying only on small color dots
3. Improve appointment blocks:
   - consistent status/staff color treatment
   - better minimum readable content for short appointments
   - accessible labels containing client, service, staff, time, and status
4. Improve `AppointmentSheet` content hierarchy:
   - primary details first
   - phone/status/edit/delete actions grouped predictably
   - destructive delete visually separated
   - inline error and loading states for mutations
5. Ensure all calendar color/status styling uses theme helpers, not raw colors.
6. Keep FABs clear of bottom nav, safe area, and scroll content.

Acceptance:

- Users can reliably create or inspect appointments from day/week/month/agenda views.
- Calendar remains readable in light and dark mode.
- Color is not the only indicator of appointment state.

## Phase 8: Dashboard And Data Visualization

Area: dashboard cards, charts, and data readability.

Outcome: manager reporting is scan-friendly, accessible, and token-driven.

Tasks:

1. Replace raw `BAR_COLORS` in `apps/native/app/dashboard.tsx` with semantic chart/status tokens.
2. Add text labels or legends for every chart-like visual so meaning is not color-only.
3. Ensure chart/data colors meet contrast requirements in light and dark mode.
4. Use tabular number styling for counts, prices, and percentages where practical.
5. Reduce one-line truncation for service and staff names; allow wrapping or provide a clearer compact layout.
6. Add retry and stale-data behavior to dashboard errors instead of only first-load skeleton behavior.
7. Keep dashboard cards dense but not cramped; preserve 4/8pt spacing rhythm.

Acceptance:

- Dashboard status and progress visuals are understandable without relying only on color.
- Dashboard passes native style guardrails.
- Long Persian service/staff names do not break layout.

## Phase 9: Navigation, Settings, And Destructive Actions

Area: navigation predictability and high-risk actions.

Outcome: users understand where they are, how to go back, and what will happen before destructive/session actions.

Tasks:

1. Keep bottom navigation limited to top-level destinations.
2. Standardize manager "More" rows:
   - icon
   - label
   - short hint
   - chevron
   - consistent row height
   - accessible role and label
3. Confirm logout before ending the session.
4. Confirm destructive appointment deletion with app-consistent language.
5. Avoid hiding critical actions behind long press only.
6. Preserve route params and back behavior for calendar handoffs from today, retention, and client profile.
7. Ensure manager-only destinations explain unavailable states where applicable rather than silently failing.

Acceptance:

- Back behavior is predictable across pushed screens and modal/sheet flows.
- Logout and destructive actions require confirmation.
- Manager settings remain scannable and reachable with touch and screen reader navigation.

## Phase 10: Verification And Device QA

Area: final verification.

Outcome: UX changes are proven on real native constraints, not only by code inspection.

Automated checks:

```sh
pnpm --filter @repo/native typecheck
pnpm --filter @repo/native lint
pnpm --filter @repo/native style:check
```

Manual Expo checks:

1. Login and signup on small iOS and Android devices with keyboard open.
2. Login and signup with wrong credentials and slow network.
3. Every sheet and modal:
   - open
   - close
   - Android back
   - outside tap where allowed
   - dirty dismissal confirmation where required
4. Calendar day/week/month/agenda:
   - inspect appointment
   - create appointment from slot
   - edit appointment
   - delete appointment
   - status changes
   - availability search handoff
5. Clients/staff/services with large data sets.
6. Dashboard and reporting in light and dark mode.
7. Dynamic Type / larger system text.
8. Long Persian names, services, notes, and errors.
9. Screen reader pass for:
   - bottom nav
   - settings rows
   - form fields
   - picker options
   - appointment actions
10. Landscape orientation smoke test for auth, forms, modals, and calendar.

Acceptance:

- No known keyboard obstruction remains in auth or modal forms.
- No primary action is hidden by keyboard, safe area, FAB, or bottom nav.
- All phases pass the automated checks above.
- Manual QA notes are captured before the work is considered complete.

## Suggested Implementation Order

1. Phase 1: UX Foundation And Guardrails
2. Phase 2: Shared Modal And Sheet System
3. Phase 3: Forms And Keyboard Safety
4. Phase 4: Touch Targets And Accessibility
5. Phase 5: Lists And Scroll Performance
6. Phase 6: Loading, Empty, Error, And Offline Feedback
7. Phase 7: Calendar UX
8. Phase 8: Dashboard And Data Visualization
9. Phase 9: Navigation, Settings, And Destructive Actions
10. Phase 10: Verification And Device QA

This order fixes the cross-cutting primitives first, then migrates high-traffic surfaces, and leaves final verification as its own explicit phase.
