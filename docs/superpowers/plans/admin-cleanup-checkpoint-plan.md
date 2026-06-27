# Admin Cleanup Checkpoint Plan

## Goal

Make the admin panel simple and pleasant to work with before doing the larger service catalog redesign. This plan avoids polishing legacy service-family/combo workflows that we expect to replace.

## Guardrails

- Remove admin friction instead of hiding it behind defaults.
- Prefer focused route pages over large nested tabs and modal-heavy workflows.
- Keep the salon table as a launcher, not a dashboard.
- Keep service terminology simple in the UI: category, service, package.
- Do not implement Service Package scheduling in this cleanup pass.
- Do not rebuild the service/preset data model in this cleanup pass.

## Phase 1: Remove Forced Admin Friction

### Scope

- Remove all user-entered admin `reason` fields from admin forms.
- Remove all `LIVE` confirmation fields from admin forms.
- Add a small database migration to remove `admin_audit_events.reason`.
- Update audit writes, API schemas, OpenAPI schemas, generated client usage, and tests.
- Keep audit attribution by actor, action, target, salon, metadata, request info, and timestamp.
- Keep optional internal notes out of forced update flows.

### Out Of Scope

- Redesigning audit log UI beyond what is required by the removed column.
- Adding replacement free-text fields.
- Service catalog migrations.

### Checkpoint For Approval

Approve once admins can perform current salon/setup/preset actions without reason or live confirmation prompts, and tests confirm audit events still record who did what.

## Phase 2: Simplify Salon Table

### Scope

- Keep default salon table columns lean:
  - Salon name
  - Status
  - Owner or handoff state
  - Phone
  - Staff count
  - Service count
  - Created or updated date
- Remove upcoming appointments and pending appointment request counts from the table.
- Make row/name navigation open the Salon Workspace overview.
- Add a three-dot row action menu with shortcuts to important pages:
  - Overview
  - Edit salon info
  - Hours
  - Presence
  - Staff
  - Services
  - Clients
  - Requests
  - Handoff, only for setup salons
- Keep create setup salon as a standalone toolbar action, not in the row menu.
- Keep create setup salon as a small dialog with only:
  - Salon name
  - Intended owner phone
- Move status changes into simple row actions with a confirmation dialog.

### Out Of Scope

- Appointment/request dashboard stats in the table.
- A dedicated governance page.
- Reason fields on status changes.

### Checkpoint For Approval

Approve once the salon table feels like a clean launcher: easy to scan, quick to create a setup salon, and fast to jump into important salon pages.

## Phase 3: Introduce Salon Workspace Routing

### Scope

Replace the current nested salon detail tabs with route pages:

- `/salons/:salonId` -> overview
- `/salons/:salonId/edit` -> salon info
- `/salons/:salonId/hours`
- `/salons/:salonId/presence`
- `/salons/:salonId/staff`
- `/salons/:salonId/services`
- `/salons/:salonId/clients`
- `/salons/:salonId/requests`
- `/salons/:salonId/handoff`

Each page should have one clear purpose. Simple setup pages should have one primary save action. List-building pages such as staff, services, clients, and requests may keep row-level actions where they are natural.

### Out Of Scope

- Rebuilding the service data model.
- Rebuilding preset catalog data model.
- Multi-staff package scheduling.
- A governance/status management page.

### Checkpoint For Approval

Approve once the Salon Workspace has direct links for every major area and no longer depends on one large nested tab screen for daily admin work.

## Phase 4: Build The Workspace Overview

### Scope

The Salon Workspace overview should answer: what is going on with this salon?

Include:

- Salon identity, status, and handoff state.
- Staff count.
- Service count.
- Client count.
- Appointment stats in overview, not in the salon table.
- Pending appointment request count.
- Tiny previews for recent requests or next appointments, capped at 3-5 rows.
- Shortcuts to related workspace pages.

### Out Of Scope

- Editing forms on the overview page.
- Full operational tables on the overview page.
- Complex charts.

### Checkpoint For Approval

Approve once the overview gives enough context to understand a salon quickly and then jump to the right page.

## Phase 5: Convert Setup Editing Into Focused Pages

### Scope

- Move setup editing out of bundled tabs into focused pages.
- Pages should be simple and save only their own concern:
  - Edit salon info
  - Hours
  - Presence
  - Staff
  - Services
  - Clients
  - Handoff
- Handoff remains a simple setup page/action because transferring a Setup Salon to the owner is a real lifecycle step.

### Out Of Scope

- Reintroducing reason/live confirmation fields.
- A setup case workflow.
- Owner impersonation or admin-created owner identity.

### Checkpoint For Approval

Approve once setup work feels like editing a small workspace, not filling out an admin case file.

## Phase 6: Light Service UI Language Cleanup

### Scope

Bridge the UI toward the future service model without doing the migration yet:

- Show `Service` instead of `ServiceVariant` in admin copy.
- Prefer `Category` and `Service`.
- De-emphasize or hide `Family` where possible.
- Show `Package` instead of `Combo`.
- Avoid building new family-heavy screens.
- Keep existing APIs/database shape only as compatibility behind the scenes.

### Out Of Scope

- Removing `service_families`.
- Rebuilding catalog presets.
- Implementing Service Packages.
- Changing appointment or calendar data models.

### Checkpoint For Approval

Approve once admin copy and screens stop teaching the old complex model, while still working against the current backend.

## Phase 7: Final Cleanup And Verification

### Scope

- Remove dead admin components created only for reason/live confirmation flows.
- Update route tests and admin feature tests.
- Run typecheck and relevant test suites.
- Do a quick visual pass on the admin panel at desktop and mobile widths.
- Confirm no major text overflow or nested-card clutter was introduced.

### Checkpoint For Approval

Approve once the admin cleanup is shippable and the remaining service catalog redesign work is clearly separate.

## Explicitly Deferred

- Category -> Service database migration.
- Preset category/service library migration.
- Catalog Preset assembly redesign.
- Service Package scheduling.
- Package request approval scheduling.
- Multi-staff package calendar/dashboard behavior.
