# Advanced Service Catalog Phased Plan

## Summary

Extend the completed service catalog into advanced salon selling flows while preserving the current v1 behavior until each feature is intentionally enabled.

The current v1 model is:

- One appointment selects one bookable service variant.
- Appointments store booked service name, duration, and price snapshots.
- Staff service capability is variant-level.
- Dashboard, retention, and history use booked snapshots for historical accuracy.

Phase 1 should build on that foundation in this order:

1. Fixed combo/package services.
2. Configurable add-ons.

This order keeps the blast radius controlled. Combos keep the "one appointment, one selected service" model. Add-ons extend the selected service with optional extras while preserving a single appointment, single staff member, and single booked service variant.

## Goals

- Let managers sell fixed packages such as `پکیج عروس`, `کاشت دست و پا`, or `رنگ و براشینگ`.
- Let managers define optional add-ons such as `دیزاین`, `فرنچ`, `ریموو`, `قد بلند`, and `ترمیم ناخن شکسته`.
- Keep historical appointment meaning stable after catalog price, duration, combo, or add-on changes.
- Keep web and native parity for manager and staff workflows.

## Non-Goals For First Advanced Release

- Do not build multi-service appointments. When a customer wants multiple independent services, the manager should book separate appointments.
- Do not build multi-staff parallel service execution in the first slice.
- Do not let a package automatically book different staff members for different components in the first slice.
- Do not add inventory, product consumption, commissions, discounts, tax, or deposits.
- Do not add customer self-booking complexity unless a separate customer booking plan exists.

## Confirmed Product Decisions

- Combo ServiceVariant duration and price are authoritative on the combo itself. Component duration/price totals are shown only as reference guidance so managers can sell combos with deliberate package pricing or discounts.
- Combo components are descriptive manager-facing composition only in v1. Booking, availability, staff capability, revenue, and snapshots use the Combo ServiceVariant itself.
- Combo components are not snapshotted onto appointments in v1; any displayed component summary is live catalog metadata.
- Inactive standard ServiceVariants may remain inside an active Combo ServiceVariant. Inactive means not directly bookable as its own service, not unusable as a combo component.
- Active Combo ServiceVariants must have at least one component. Empty combo composition is allowed only while the combo is inactive/draft.
- Combo completeness is enforced both when activating/saving combo composition and defensively when booking.
- Staff capability for a Combo ServiceVariant is explicit on the combo itself. Capability is not inferred from component ServiceVariants in the first release.
- Service Add-ons are available through explicit category, family, or ServiceVariant scopes only. No global salon-wide add-ons in v1; an add-on with no active scopes does not appear in booking.
- Service Add-on scopes are include-only in v1. Narrower scopes do not exclude or override broader scopes.
- Service Add-ons may add price, duration, or both, but both deltas cannot be zero. Add-ons cannot subtract price or duration in v1.
- Service Add-ons have no quantity in v1 and cannot be selected more than once on the same appointment.
- Service Add-on matching treats standard and combo ServiceVariants uniformly. Category, family, and ServiceVariant scopes can make an add-on available for a combo.
- New add-on selections are resolved from the selected ServiceVariant's current catalog category/family/service scopes.
- Multi-service appointments are out of scope. Managers should create separate appointments when a customer asks for multiple independent services.
- `booked_service_duration` and `booked_service_price` remain the selected ServiceVariant snapshot. `booked_total_duration` and `booked_total_price` store the selected ServiceVariant plus selected add-ons.
- Service Add-ons are soft-deactivated from manager UI rather than hard-deleted.
- Appointment add-on snapshots are recalculated only when selected add-ons or the selected ServiceVariant change. Other appointment edits preserve existing add-on snapshots and totals.
- Appointment updates that change `serviceId` must explicitly include `addonIds`; omitting `addonIds` while changing service is a validation error.
- Service Add-ons do not require staff capability in v1. Staff eligibility remains ServiceVariant-level only.
- Appointment end time is forced from start time plus booked total duration when the selected ServiceVariant or selected add-ons change.
- Inactive ServiceVariants and add-ons are not available for new booking selections, but existing inactive historical selections may remain visible and preserved during appointment edits.
- Add-ons are not counted as services in v1 reporting. Popular services and favorite service continue to count the selected ServiceVariant or Combo ServiceVariant.
- Appointment list/range read models include booked totals and add-on count; appointment detail includes full booked add-on snapshots.
- Add-ons and add-on scopes should participate in data-client sync/offline projection before add-on booking ships.
- The server is authoritative for booked service, add-on, total, and end-time snapshot calculation. Clients may preview totals but should submit only selections.
- Appointment create/update requests that include `serviceId` or `addonIds` should ignore client-submitted `endTime`/`durationMinutes` for catalog duration calculation and compute end time from booked total duration.
- Availability search remains based on the selected ServiceVariant only. Add-ons are applied during final booking/edit validation and may cause save-time scheduling rejection if they extend the appointment beyond availability.
- In normal manager booking/edit flows, selecting a ServiceVariant fills the appointment duration, and selecting/removing add-ons recomputes the end time from the new booked total duration.
- When add-ons are added or removed on an existing appointment, preserve the appointment start time and move the end time earlier or later to match the new booked total duration.
- When start time changes on an add-on-aware appointment, preserve booked total duration and recompute end time from the new start time.

## Shared Domain Language

- `ServiceVariant`: existing sellable/bookable variant represented by the `Service` type and `services` table.
- `Combo ServiceVariant`: a `ServiceVariant` where `kind = 'combo'`.
- `ComboComponent`: a reference from one Combo ServiceVariant to a standard ServiceVariant.
- `ServiceAddon`: an optional extra that can be attached during booking.
- `BookedAddonSnapshot`: a booked add-on snapshot attached to an appointment.
- `AppointmentTotalsSnapshot`: total booked duration and total booked price for the appointment, including selected add-ons.

## Target Data Model

### Combo Components

Add `service_combo_components`:

- `id`
- `salon_id`
- `combo_service_id`
- `component_service_id`
- `sort_order`
- `created_at`
- `updated_at`

Rules:

- `combo_service_id` must reference a service with `kind = 'combo'`.
- `component_service_id` should reference a standard service for the first release.
- A combo should not contain itself.
- A combo should not contain another combo in the first release.
- A combo should not contain the same component more than once.
- An active combo must have at least one component.
- Saving component replacement must not leave an active combo empty.
- Components are editable references, not historical booking snapshots.
- Component references do not drive booking, availability, staff assignment, or reporting calculations in v1.
- Component references are not copied into appointment history; historical meaning comes from the booked Combo ServiceVariant snapshot.
- Inactive standard ServiceVariants may remain as components and should not block booking an active Combo ServiceVariant.
- Missing or deleted component references should block saving combo composition until resolved.
- Component summaries may be shown to managers and staff for clarity/preparation, but customer-facing reminders should use only the booked Combo ServiceVariant name in v1.
- Avoid presenting live component summaries in client history as historical facts after combo composition changes.
- Combo component order is manager-controlled through `sort_order` and can communicate intended service flow.

### Add-ons

Add `service_addons`:

- `id`
- `salon_id`
- `name`
- `price_delta`
- `duration_delta`
- `active`
- `sort_order`
- optional `description`
- optional `color`
- `created_at`
- `updated_at`

Add explicit add-on scope tables:

- `service_addon_category_scopes`
- `service_addon_family_scopes`
- `service_addon_service_scopes`
- `id`
- `salon_id`
- `addon_id`
- `scope_id`

Rules:

- An add-on with no active scopes should not appear in booking.
- If multiple scopes match a service, show the add-on once.
- Add-ons are manager-editable salon data, not fixed system data.
- Active add-on names should be unique per salon after normalization.
- Inactive add-ons do not appear in booking, but remain available for historical references and can be reactivated.
- Reactivating an inactive add-on must pass the same active-name uniqueness rule.
- There is no global add-on scope in v1; managers can apply the same add-on to multiple categories when they want broad availability.
- Scope resolution is additive and include-only: a category, family, or ServiceVariant match makes the add-on available.
- Scope resolution uses the selected ServiceVariant's current catalog position for new selections.
- Scope saves should normalize redundant narrower scopes away when a broader selected scope already covers them.
- If an add-on is scoped to a category, family and ServiceVariant scopes under that category should not also be stored for the same add-on.
- If an add-on is scoped to a family, ServiceVariant scopes under that family should not also be stored for the same add-on.
- Scopes to inactive categories, families, or ServiceVariants are preserved and shown in settings with an inactive indicator.
- Inactive scoped targets do not make inactive services selectable for new bookings, but reactivation restores the preserved add-on availability.
- Missing or hard-deleted scope targets should be cleaned up or blocked on save.
- `price_delta` and `duration_delta` must be non-negative, and at least one must be greater than zero.
- Discounts should be modeled through authoritative combo pricing or a future discounts feature, not negative add-on deltas.
- Add-ons do not apply to combo components in v1; they apply only to the selected ServiceVariant being booked.
- Inactive add-ons already selected on an appointment may remain on that appointment unless the manager removes or replaces them.
- Existing booked add-on snapshots remain preserved even if the selected ServiceVariant later moves categories/families or add-on scopes change.
- Removed inactive add-ons cannot be re-added from booking unless reactivated in settings.
- A selected add-on may appear at most once per appointment; booked add-on snapshots do not include quantity.
- Matching add-ons should be displayed by `sort_order`, then name. Scope specificity does not control display order.

### Appointment Add-on Snapshots

Add `appointment_addon_lines`:

- `id`
- `salon_id`
- `appointment_id`
- nullable `addon_id`
- `booked_addon_name`
- `booked_addon_duration_delta`
- `booked_addon_price_delta`
- `sort_order`

Appointments should include:

- `booked_total_duration`
- `booked_total_price`

Compatibility:

- Keep existing `appointments.service_id`, `booked_service_name`, `booked_service_duration`, and `booked_service_price` for the selected ServiceVariant snapshot.
- Use appointment total snapshot fields for scheduling duration, revenue, retention spend, and history when add-ons are selected.
- Backfill old appointments with `booked_total_duration = booked_service_duration` and `booked_total_price = booked_service_price`.
- Pre-add-on legacy appointments may have scheduled time ranges that differ from `booked_total_duration` because earlier flows allowed explicit end time or duration overrides.
- Actual scheduled duration should match `booked_total_duration`; add-on booking does not introduce manual duration overrides.
- Updates that do not change service or add-ons may preserve legacy manual scheduling behavior, but add-on-aware forms should not expose manual duration override.
- Revenue and retention spend use `booked_total_price`; service popularity uses the booked ServiceVariant snapshot.
- Booked add-on snapshot fields are authoritative for historical display; `addon_id` is nullable traceability only.

## API Surface

Shared add-on read model:

```ts
type ServiceAddonScope =
  | { type: 'category'; categoryId: string; categoryName: string; active: boolean }
  | { type: 'family'; familyId: string; familyName: string; categoryId: string; active: boolean }
  | { type: 'service'; serviceId: string; serviceName: string; familyId: string; active: boolean }

type ServiceAddon = {
  id: string
  salonId: string
  name: string
  priceDelta: number
  durationDelta: number
  active: boolean
  description?: string | null
  color?: string | null
  scopes: ServiceAddonScope[]
}
```

Add routes:

- `GET /api/services/:id/combo-components`
- `PUT /api/services/:id/combo-components`
- `GET /api/service-addons`
- `POST /api/service-addons`
- `PATCH /api/service-addons/:id`
- `GET /api/services/:id/addons`
- `GET /api/appointments/:id/addons`

Booking APIs should continue accepting the current simple `serviceId` until the add-on booking phase explicitly changes the intake shape.

Appointment range/list responses should include:

- `bookedTotalDuration`
- `bookedTotalPrice`
- `bookedAddonCount`

Appointment detail responses should include:

- `bookedAddons: BookedAddonSnapshot[]`

Future create/update appointment intake shape:

- `serviceId`
- `addonIds?: string[]`
- server-calculated totals
- snapshots persisted from current catalog rows at booking time

## UI Surface

### Settings Catalog

Combo services:

- Keep combo services in the existing grouped catalog.
- Show a `پکیج` or `ترکیبی` badge when `kind = 'combo'`.
- Add a combo composition section inside the service drawer.
- Let managers add, remove, and reorder component services.
- Show component total duration/price beside the manually entered combo duration/price.

Add-ons:

- Add an `افزودنی‌ها` section in service settings.
- Add create/edit drawer for add-ons.
- Let managers scope an add-on to categories, families, or services.
- Show active/inactive state.

### Booking

Combos:

- Combo services appear in the same grouped service picker.
- Selecting a combo still submits one `serviceId`.
- Detail text should show combo duration/price and optionally a short component summary.
- Staff appointment detail may show a descriptive component summary for combos.

Add-ons:

- After selecting a base service, show matching add-ons.
- Add-ons should be optional checkboxes/toggles.
- Price and duration preview updates immediately.
- Submit selected `addonIds` once backend supports snapshots.
- Selecting/removing add-ons during create or edit recomputes the displayed end time from the selected service plus add-on durations.
- On edit, add-on changes preserve start time and adjust end time to match the new total duration.
- Existing inactive add-ons on an appointment should appear as historical selected items during edit, but should not be available as new options.
- When editing add-ons, available new options come from the selected ServiceVariant's current catalog scopes.

### Staff Assignment

Combos:

- Combo services can be assigned like any other service variant.
- First release should not infer combo capability from components.
- A staff member who can perform every component still needs explicit assignment to the Combo ServiceVariant before they can be booked for it.

Add-ons:

- Default: add-ons do not require staff assignment.
- Later optional: add-on capability can be added if real salons need it.
- Add-on duration affects availability; add-on identity does not affect staff eligibility.

## Implementation Phases

### Phase 1.0: Advanced Catalog Decisions

Status: completed in this slice.

- Confirm product decisions listed above.
- Document final naming in `CONTEXT.md`.
- Use authoritative combo duration/price with calculated component reference totals.
- Store add-on scopes in separate category, family, and ServiceVariant scope tables.
- Done when schema/API names and behavior are final enough to implement without parallel concepts.

### Phase 1.1: Combo Schema And Core Logic

Status: completed in this slice.

- Add `service_combo_components` table.
- Add shared types for `ComboComponent` and combo detail responses.
- Add database functions to list and replace combo components transactionally.
- Validate that combo components belong to the same salon.
- Validate no self-reference.
- Validate no nested combos for the first release.
- Validate no duplicate component ServiceVariants inside the same combo.
- Validate that Combo ServiceVariants cannot be activated with zero valid components.
- Validate that component replacement cannot leave an active combo empty.
- Defensively reject booking an active Combo ServiceVariant if data drift leaves it with zero valid components.
- Allow inactive standard ServiceVariants as components, but surface their inactive state in combo detail responses.
- Add tests for combo component validation and transactional replacement.
- Done when combo component data can be persisted and read without affecting booking.

### Phase 1.2: Combo APIs And Data Client

Status: completed in this slice.

- Add combo component API routes.
- Add shared validation schemas.
- Add API-client/data-client methods.
- Preserve offline projections for services without needing combo component sync in the first slice.
- Add tests for create/update/list behavior.
- Done when managers can read and save combo composition through the data layer.

### Phase 1.3: Combo Manager UI

Status: completed in this slice.

- Update web service drawer to show combo component editor when `kind = 'combo'`.
- Add component picker using the grouped service picker, excluding the combo itself and other combos.
- Show manual duration/price and component reference totals.
- Show an incomplete/draft state when a Combo ServiceVariant has no components.
- Add native parity for the same combo composition flow.
- Add combo badges in service catalog rows.
- Done when managers can create and maintain fixed packages from web and native settings.

### Phase 1.4: Combo Booking And Reporting

Status: completed in this slice.

- Keep appointment create/edit payload as one `serviceId`.
- Allow combo services in appointment create/edit, availability, and staff assignment.
- Ensure snapshot fields store combo name, duration, and price.
- Keep dashboard, retention, and history using appointment snapshots.
- Add tests proving a later component price change does not affect booked combo revenue.
- Done when combos are fully usable as fixed sellable services without line-item appointment changes.

### Phase 1.5: Add-on Schema And Core Logic

Status: completed in this slice.

- Add `service_addons`.
- Add separate add-on scope tables for categories, families, and ServiceVariants.
- Add shared types for add-ons and matching add-ons for a service.
- Add database functions to create/update add-ons and resolve active add-ons for a service.
- Add API-client/data-client methods and offline projection support for add-ons and add-on scopes.
- Add validation for non-negative price/duration deltas, with at least one positive delta.
- Validate active add-on name uniqueness per salon, including reactivation.
- Support add-on `sort_order` for stable manager-controlled display ordering.
- Add tests for category, family, and service scoped matching.
- Normalize redundant add-on scopes on save so broad scopes do not store covered child scopes.
- Done when add-ons can be managed and resolved for any selected service.

### Phase 1.6: Add-on Manager UI

- Add web settings add-on management section.
- Add add-on create/edit drawer with name, price delta, duration delta, active, description, and scopes.
- Let managers deactivate and reactivate add-ons; do not expose hard delete in v1.
- Add native parity.
- Add clear labels for scope level: `دسته`, `خانواده خدمت`, `خدمت`.
- Done when managers can maintain add-ons without touching database rows.

### Phase 1.7: Appointment Add-on Snapshots

- Add a minimal `appointment_addon_lines` table tied directly to appointment.
- Add appointment total snapshot fields for total duration and total price including selected add-ons.
- Update appointment range/list mappers to expose booked totals and add-on count.
- Update appointment detail mappers to expose full booked add-on snapshots.
- Keep base booked service snapshot fields unchanged when selected add-ons change; update total snapshots and add-on snapshots instead.
- Add server-side calculation for total duration and total price from base service plus selected add-ons.
- Recompute appointment end time from start time plus booked total duration when service or add-on selections change.
- Add booking create/update support for `addonIds`.
- Reject duplicate add-on IDs in appointment create/update payloads.
- Accept selected add-on IDs from clients, but never accept client-submitted booked add-on names, deltas, totals, or end-time calculations as authoritative.
- Ignore client `endTime`/`durationMinutes` on create or update requests that change selected service/add-ons; compute from booked total duration instead.
- Store booked add-on snapshots on appointment creation and when selected add-ons change.
- Preserve existing add-on snapshots when update payloads omit `addonIds` and do not change `serviceId`.
- Reject appointment updates that change `serviceId` without explicitly providing `addonIds`.
- Treat `addonIds: []` on service change as an intentional clear-add-ons request.
- Revalidate selected add-ons against the new ServiceVariant when `serviceId` changes, then rebuild add-on and total snapshots.
- Add tests for historical accuracy after add-on price/duration changes.
- Done when appointments can store selected add-ons as historical snapshots.

### Phase 1.8: Add-on Booking UI

- Update web appointment create/edit drawers to show matching add-ons after service selection.
- Keep availability search based on the selected ServiceVariant duration only.
- Update web and native appointment create/edit flows to show add-ons after base service/time selection.
- Show clear save-time scheduling errors when selected add-ons extend the appointment beyond staff availability or create an overlap.
- Treat client-side price/duration totals as preview only; saved snapshots come from the server response.
- Disable add-on booking while offline if local add-on catalog data is unavailable.
- In week calendar view, keep appointment labels minimal and show only the booked service name.
- In day view and agenda/today views, show booked service name plus add-on count, such as `کاشت با پودر +۲`.
- Show full add-on details in appointment detail and client history.
- Done when managers can book service plus add-ons on web and native.

## Test Plan

### Combo Tests

- Create a combo service.
- Add standard component services.
- Reject self-reference.
- Reject nested combo component in first release.
- Reject duplicate components in one combo.
- Reject activating or booking an active combo with no components.
- Allow inactive standard components inside an active combo.
- Replace component list transactionally.
- Book combo and store combo snapshot.
- Reject combo booking when selected staff is not explicitly assigned to the Combo ServiceVariant, even if they can perform the components.
- Change component price after booking; old combo appointment revenue stays unchanged.

### Add-on Tests

- Create add-on with price and duration deltas.
- Reject duplicate add-on IDs on one appointment.
- Reject duplicate active add-on names in the same salon.
- Scope add-on to category, family, and service.
- Saving a broad add-on scope removes redundant child scopes for the same add-on.
- Resolve matching add-ons for a selected service.
- Do not show inactive add-ons.
- Book service with add-ons and store add-on snapshots.
- Base service snapshot stays unchanged while appointment total snapshot includes add-ons.
- Editing unrelated appointment fields does not recalculate old add-on snapshots.
- Change add-on price after booking; old appointment history stays unchanged.

### UI Tests

- Manager can compose combo on web.
- Manager can compose combo on native.
- Manager can create add-on and scope it.
- Booking service plus add-ons updates duration/price preview.
- Changing service or add-ons forces the appointment end time from the calculated total duration.
- Availability search ignores add-ons, but final save validates the add-on-extended appointment window.
- Week view stays minimal while day and agenda/today views show add-on count.
- Client history shows historical booked names, prices, and add-ons.
- Popular service and favorite service reporting ignore add-ons in v1.

## Rollout Strategy

- Ship combos behind normal catalog UI first because they preserve the simple booking contract.
- Ship add-on management before add-on booking so salons can prepare catalog data.
- Ship add-on booking after snapshot tests are in place.
- Preserve the single-service appointment model; managers can book separate appointments for multiple independent services.
