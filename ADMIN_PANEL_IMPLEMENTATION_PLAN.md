# Admin V1 Rebuild: Official shadcn Sidebar + Feature-Based Admin

## Summary

Keep `apps/admin` as the app shell, but rewrite the broken sidebar/layout from the official shadcn Radix sidebar docs, with this exact link as the source of truth: [shadcn Radix Sidebar](https://ui.shadcn.com/docs/components/radix/sidebar). Do not patch the current sidebar in place.

Use [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin) as a pattern donor for feature structure, route/layout organization, command search, table utilities, dialog state, and RTL-aware primitives. Do not fork it wholesale and do not keep its demo/auth/domain pages.

V1 stays local-only on `localhost:3003`, talks to the local API on `localhost:3002`, and switches local/live data by running the local API against either local Postgres or live DB.

## Key Implementation Changes

- Replace the current admin sidebar completely:
  - Rebuild `components/ui/sidebar.tsx` from the official shadcn Radix sidebar docs, including `SidebarProvider`, `Sidebar`, `SidebarInset`, `SidebarTrigger`, `SidebarRail`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, and `SidebarMenu*`.
  - Apply shadcn RTL guidance from [RTL docs](https://ui.shadcn.com/docs/rtl) and [Vite RTL docs](https://ui.shadcn.com/docs/rtl/vite): `html lang="fa" dir="rtl"`, Radix `DirectionProvider`, `components.json` with `rtl: true`, logical Tailwind classes, and `dir="rtl"` passed into portal/sheet content.
  - Use `side="right"` and `variant="inset"` by default. Sidebar must visually match the official sidebar composition, not the current custom sidebar.
  - Delete or stop using the old custom `AdminSidebar` path and any broken duplicate sidebar behavior.

- Convert admin routing to file-based TanStack Router:
  - Add `@tanstack/router-plugin` to admin Vite config, same as `apps/pwa`.
  - Replace manual route construction with `src/routes/__root.tsx`, `src/routes/login.tsx`, and `_admin` layout routes.
  - Planned V1 routes: `/`, `/login`, `/overview`, `/salons`, `/salons/$salonId`, `/catalog-presets`, `/audit-log`, `/settings`.
  - `/` redirects to `/overview`.
  - Platform admin management is exposed through `/settings/platform-admins` or a role-gated settings tab for `platform_owner`.
  - Do not keep hidden compatibility routes for deferred legacy surfaces such as `/users`, `/messaging-health`, or `/support-lookup` unless they are explicitly promoted back into V1.

- Restructure around feature folders, inspired by `satnaing/shadcn-admin`:
  - `features/salons`: page, table, columns, detail tabs, queries, status/note dialogs.
  - `features/catalog-presets`: table, preset editor, dialogs, queries.
  - `features/overview`: metric panels and recent activity.
  - `features/audit-log`: audit table and filters.
  - `features/admin-session`: auth guard, current admin, data-source badge.
  - Remove the current monolithic `features/admin-page.tsx`.

## Reusable Extraction From `satnaing/shadcn-admin`

- Copy/adapt these patterns:
  - `AuthenticatedLayout` shape: providers + `SidebarProvider` + `AppSidebar` + `SidebarInset`.
  - `AppSidebar`, `NavGroup`, `NavUser`, `TeamSwitcher` structure, replacing all demo data with Saluna admin nav config.
  - `Header`, `Main`, `Search`, `CommandMenu`, `NavigationProgress`, `SkipToMain`.
  - `data-table` utilities: column header, toolbar, faceted filters, pagination, view options.
  - `useTableUrlState`, `useDialogState`, `ConfirmDialog`, `LongText`, `SelectDropdown`.
  - Provider/dialog pattern: each mutable feature owns `FeatureProvider`, `FeatureDialogs`, and row-level actions.

- Do not bring over:
  - Clerk auth, Clerk routes, auth demo pages.
  - Demo `tasks`, `users`, `apps`, `chats`, fake data, fake stores.
  - Demo dashboard charts unless rebuilt from Saluna API data.
  - Public config drawer as a product feature. Layout/theme controls can exist only as local dev helpers if needed.
  - Upstream branding, icons, avatars, screenshots, and demo copy.

- Preserve attribution:
  - Keep/update `apps/admin/THIRD_PARTY_NOTICES.md` for any copied/adapted MIT source.

## Admin V1 Behavior

- Focused nav:
  - Overview
  - Salons
  - Catalog Presets
  - Audit Log
  - Settings
  - Existing broader admin capabilities may remain API-supported, but are intentionally out of the primary V1 nav.
  - `Platform Admins` remains reachable through `Settings` for `platform_owner` users so platform access can still be managed.
  - Messaging health, notification deliveries, support appointments, support appointment requests, and user browsing are deferred from the primary V1 UI unless promoted by an explicit support workflow need.

- Salons:
  - Searchable, paginated salon table.
  - Detail page with tabs: Overview, Clients, Appointments, Appointment Requests, Staff, Services, Notes.
  - Useful summaries plus paginated/read-only rows for tenant data.
  - Tenant data tabs are intentionally read-only in V1; no Client, Appointment, AppointmentRequest, Staff, or Service mutations from the platform admin.
  - Use canonical domain language: `Client`, `Appointment`, `AppointmentRequest`, `Staff`, and `ServiceVariant` where variant-level catalog rows must be distinguished.
  - Allowed mutations: salon status and internal notes, both with explicit reason dialogs.

- Catalog Presets:
  - CRUD `CatalogPreset` records.
  - Use domain language: category, family, service variant.
  - Tree editor for preset category -> family -> service variant structure.
  - Sidebar/docs label: `Catalog Presets`; Persian UI copy: `قالب خدمات`.
  - Avoid new admin UI copy such as template, starter, package, bundle, or defaults for this feature.
  - Every mutation requires a reason.

- Data source:
  - Add scripts like `dev:admin-stack:local-data` and `dev:admin-stack:live-data`.
  - Local admin always calls local API; local API decides DB via env.
  - Add `ADMIN_DATA_SOURCE=local | live`.
  - Show a persistent visible badge/banner when in live-data mode.
  - Live mode may mutate live DB, by explicit decision.
  - Every live-data mutation dialog must clearly state that it affects live production data.
  - Existing reason requirements stay mandatory for live-data mutations.
  - High-impact live-data mutations, including salon status changes and platform admin changes, require an extra confirmation phrase such as `LIVE`.

## API And Data

- Keep Better Auth for the admin session.
- `PLATFORM_ADMIN_BOOTSTRAP_PHONES` is only for initial/emergency bootstrap of the first `platform_owner`; ongoing platform access is managed through `platform_admins` in Settings.
- Extend admin API with salon detail tab endpoints:
  - `GET /api/v1/admin/salons/:id/clients`
  - `GET /api/v1/admin/salons/:id/appointments`
  - `GET /api/v1/admin/salons/:id/appointment-requests`
  - `GET /api/v1/admin/salons/:id/staff`
  - `GET /api/v1/admin/salons/:id/services`
- Expose current data source through `/api/v1/admin/auth/me` or `/api/v1/admin/runtime`.
- Regenerate OpenAPI and `@repo/api-client`.
- Rebuilt V1 admin features use generated SDK functions and TanStack query options from `@repo/api-client`.
- `apps/admin/src/lib/admin-api.ts` is not the preferred abstraction for new V1 features; keep only temporary adapters for deferred legacy surfaces, and remove them when those surfaces are deleted or rebuilt.

## Test Plan

- `pnpm --filter @repo/admin typecheck`
- `pnpm --filter @repo/admin lint`
- `pnpm --filter @repo/admin test`
- `pnpm --filter @repo/admin build`
- `pnpm --filter @repo/api test:unit`
- `pnpm generate:api-contract`
- `pnpm generate:api-client`
- Browser verify:
  - official shadcn-style right sidebar works in desktop, collapsed, rail, mobile sheet, and RTL.
  - command search navigates routes.
  - salon detail tabs load real data.
  - catalog preset CRUD works.
  - live-data mode shows an unmistakable warning before mutations.

## Assumptions

- Existing `apps/admin` stays; no `apps/admin-v2`.
- Current sidebar is replaced, not repaired.
- shadcn official sidebar docs are the layout authority.
- `satnaing/shadcn-admin` is a source of reusable structure, not a full template fork.
- Admin remains local-only for V1.
