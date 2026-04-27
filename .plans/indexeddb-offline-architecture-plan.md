# IndexedDB Offline Architecture Plan

## Context

Aravira already has partial offline foundations:

- a production PWA shell
- service-worker-based shell caching
- online/offline UI states
- local snapshot fallback for a few manager reads

What it does not have yet is a real offline-first data layer for manager workflows. Today, manager reads and writes still depend directly on HTTP calls from app screens, and the current local fallback is intentionally read-only.

The next step is to add manager offline support without letting IndexedDB leak through the app and create long-term coupling.

## Product Direction

Position the feature as:

> A local-first manager experience that keeps core salon operations usable without internet, while preserving a clean architecture that can be reused by future browser clients.

This is not just "add Dexie to the Next app."

The goal is:

- manager workflows stay usable offline
- sync remains understandable and safe
- IndexedDB stays behind an abstract data layer
- the app can opt out of offline storage later without rewriting feature code
- the same data client design can be reused by a future Vite frontend and a separate API app

## Architecture Decision

Create a new shared workspace package:

```txt
packages/data-client
```

This package becomes the only place that knows about:

- repository interfaces
- query contracts
- mutation queue behavior
- sync orchestration
- browser storage adapters
- HTTP transport adapters
- sync/conflict state models

Feature code in `apps/app` must not import:

- `indexedDB`
- `Dexie`
- local persistence helpers
- sync queue internals

Feature code should only depend on a composed `DataClient` surface.

## Core Design Rules

### 1. IndexedDB must be abstract

Use a ports-and-adapters structure inside `packages/data-client`.

Suggested shape:

```txt
packages/data-client/src/
  core/
  ports/
  adapters/http/
  adapters/indexeddb/
  adapters/online-only/
  adapters/memory/
```

Responsibilities:

- `ports`: repository contracts and storage/transport interfaces
- `core`: sync engine, queue compaction, local-first mutation flow
- `adapters/http`: current REST API integration
- `adapters/indexeddb`: browser persistence using Dexie
- `adapters/online-only`: same repositories, but no local persistence
- `adapters/memory`: tests and lightweight local verification

### 2. IndexedDB must be atomic

Every offline mutation must commit in one local transaction:

- update the local entity
- update local sync metadata
- enqueue or compact the pending mutation
- update any sync summaries if they are stored

If any step fails, nothing should be committed.

Sync processing must also be atomic per mutation:

- mark item as syncing
- call server
- on success, update local entity and queue row together
- on failure, update queue row and sync issue together

### 3. IndexedDB must stay optional

The package must support at least two browser compositions:

- `http + indexeddb`
- `http + online-only`

That means offline storage is a client composition choice, not a feature-code assumption.

Even if the Next app uses IndexedDB by default, the repository contracts must stay portable enough that another client can disable it and still use the same feature logic.

### 4. Framework independence matters

`packages/data-client` must not depend on Next.js runtime APIs.

The package should work in:

- the current Next app
- a future Vite SPA
- tests outside the app runtime

UI adapters or providers may live in the app, but the data package must remain framework-neutral.

## Public Surface

Expose one composition entrypoint:

```ts
createDataClient(config): DataClient
```

`DataClient` should expose domain modules rather than storage primitives:

- `session`
- `staff`
- `services`
- `businessSettings`
- `clients`
- `appointments`
- `sync`

Each module should provide stable operations such as:

- `list`
- `getById`
- `refresh`
- `subscribe`
- `create`
- `update`
- `remove`

Local-first behavior should be decided inside the module implementation, not by the caller.

## Initial Offline Scope

Start with manager-critical workflows only.

Offline reads in scope:

- calendar
- today
- clients list
- client detail
- manager reference data needed for booking

Offline writes in scope:

- create/update clients
- create/update/delete appointments
- manager appointment status changes

Read-only cached reference data in scope:

- current manager session user
- staff
- services
- business settings
- clients

Appointment history window:

- keep a rolling `120 days back / 120 days ahead` window in local storage

Out of scope for the first offline-write version:

- staff-only offline workflows
- retention mutations
- dashboard offline mutation logic
- onboarding offline flows
- offline writes for services, staff, schedules, and settings

## Sync Model

Use a local-first, sync-later model for manager writes.

### Queue behavior

Store pending mutations in a local queue with fields like:

- `id`
- `entityType`
- `entityId`
- `operation`
- `payload`
- `status`
- `attemptCount`
- `lastAttemptAt`
- `lastError`
- `createdAt`

Compaction rules:

- `create + update` becomes one create
- `create + delete` removes both
- repeated updates merge into the latest patch

### Sync triggers

Initial sync triggers:

- app bootstrap
- browser reconnect
- window focus / visibility return
- explicit manual retry

Do not depend on browser background sync in the first version.

### Conflict policy

Use a review-based conflict workflow.

If sync fails because server state changed while the device was offline:

- keep the local draft
- mark the mutation as `conflict`
- create a sync issue entry
- require manager review before resolution

Do not silently discard local intent.

## API Contract Requirements

Keep the current REST API shape as the first transport.

Adjustments needed:

- allow optional caller-provided UUIDs for offline-created clients
- allow optional caller-provided UUIDs for offline-created appointments
- return stable machine-readable error codes for validation/conflict failures

Priority error codes:

- `staff-overlap`
- `client-overlap`
- `missing-client`
- `missing-staff`
- `missing-service`
- `duplicate-phone`
- `unauthorized`
- `validation-error`

This prevents the sync layer from relying on localized server error strings.

## Suggested Local Tables

For the IndexedDB adapter, define local tables for:

- `meta`
- `session_users`
- `staff`
- `services`
- `business_settings`
- `clients`
- `appointments`
- `mutation_queue`
- `sync_issues`

Entity rows should carry sync metadata such as:

- `syncState`
- `lastSyncedAt`
- `lastLocalChangeAt`
- `deletedAt`
- `serverUpdatedAt`

Use tombstones for queued deletes so removed records disappear from UI immediately without losing sync intent.

## Phased Implementation

## Phase 1: Create the shared data client package

Goal: isolate data access behind stable interfaces before adding IndexedDB.

Tasks:

- create `packages/data-client`
- define repository/query interfaces
- define storage and transport ports
- add HTTP transport adapter for current REST routes
- add online-only adapter
- add memory adapter for tests
- add a `createDataClient` composition root

Acceptance criteria:

- manager feature code can begin consuming repositories without caring whether persistence exists
- no app screen needs to import Dexie or IndexedDB primitives

## Phase 2: Add IndexedDB adapter and local read model

Goal: introduce local persistence behind the shared package only.

Tasks:

- add Dexie-based adapter in `adapters/indexeddb`
- define the local tables and indexes
- persist manager reference data, clients, and appointments
- replace existing manager snapshot fallback with repository-backed reads

Acceptance criteria:

- manager screens can render from IndexedDB when local data exists
- current local snapshot approach is no longer the primary offline data path for manager screens

## Phase 3: Move manager reads to local-first repositories

Goal: make manager screens read from one consistent data source.

Tasks:

- move calendar manager reads to `DataClient`
- move today manager reads to `DataClient`
- move clients list and client detail reads to `DataClient`
- refresh local data from HTTP when online
- preserve current staff-facing online behavior for now

Acceptance criteria:

- manager pages render immediate local data when available
- reconnect refreshes server-backed local state cleanly

## Phase 4: Add offline writes for clients and appointments

Goal: make core manager operations usable without internet.

Tasks:

- implement local-first client create/update
- implement local-first appointment create/update/delete
- implement manager appointment status changes through the queue
- generate client-side UUIDs for offline-created rows
- add local overlap validation before queueing appointments

Acceptance criteria:

- manager can create and edit clients offline
- manager can create, update, and delete appointments offline
- pending changes survive reload and app reopen

## Phase 5: Add sync UX and conflict review

Goal: make sync state visible and recoverable.

Tasks:

- add a shared manager sync status surface
- show pending count, last sync time, syncing state, and needs-review count
- add conflict review actions: retry, edit and retry, discard local change
- stop queue processing on auth failure without losing local intent

Acceptance criteria:

- sync failures do not silently disappear
- manager can understand what is pending and what needs review

## Phase 6 — Coverage + portability

**Prerequisite:** Phases 1–5 are stable in production or staging (local-first reads/writes, sync bar, conflict review, auth-safe queue pause). Phase 6 deliberately widens offline write surface and proves the package outside the Next app shell.

### 6.1 Goal

- Extend offline-first **writes** to manager-owned reference data and scheduling primitives that today are still online-only or read-only locally.
- Prove **portability**: same `DataClient` composition runs in another browser bundler and stays free of Next-specific APIs.

### 6.2 Coverage expansions (recommended order)

Work in dependency order so each module can reuse queue, conflict, and validation patterns from clients/appointments.

| Area | Scope | Notes |
|------|--------|--------|
| **Business settings** | Local-first create/update for fields managers already edit online | Likely lower cardinality than appointments; good first expansion after core flows |
| **Services** | Local-first CRUD for salon services used in booking | Coordinate with calendar validation (`missing-service`); may need list refresh windows |
| **Staff** | Local-first staff rows + **staff–service** assignment changes | Overlaps with appointment `missing-staff`; ensure local reference integrity |
| **Staff schedule** | Offline edits to availability / blocks that affect booking | Highest coupling to overlap rules; implement after staff + services are consistent |

**Out of scope for Phase 6** (carry forward explicitly): staff-only app offline writes, retention, dashboard mutations, onboarding, billing integrations — same boundary as Initial Offline Scope unless product re-prioritizes.

### 6.3 Module and API work (per expansion)

For each new offline write domain:

1. **Domain module** — `list`, `getById`, `refresh`, `subscribe`, `create` / `update` / `remove` as appropriate; local-first mutations enqueue through the existing mutation queue.
2. **HTTP adapter** — map to current REST routes; optional caller UUIDs and stable error codes where the server supports them (extend the [API Contract Requirements](#api-contract-requirements) list if new codes are needed).
3. **IndexedDB adapter** — tables/indices already sketched in [Suggested Local Tables](#suggested-local-tables); extend rows with the same sync metadata pattern (`syncState`, tombstones, etc.).
4. **Compaction rules** — define create/update/delete chains for that entity type (mirror clients/appointments rules).
5. **Manager UI** — wire screens to `DataClient` only; sync UX reuses the shared bar + conflict surfaces from Phase 5.

### 6.4 Portability workstream

| Task | Done when |
|------|-----------|
| **No framework leakage** | `packages/data-client` has zero imports from `next/*`, React, or app paths; only `fetch`, `crypto` (or injected id factory), and browser globals where unavoidable. |
| **Vite consumption check** | A minimal **non-Next** entry (e.g. small Vite app or Vitest `browser`/`happy-dom` harness under `packages/data-client` or `apps/`) imports `createDataClient`, composes `http + memory` or `http + indexeddb`, runs one read + one write path without the Next app. |
| **Transport boundary** | All path shapes, headers, and JSON assumptions live in `adapters/http`; core modules speak in domain types + `HttpTransport` port only. |
| **Thin app providers** | `apps/app` providers only: build transport (base URL, credentials), choose local adapter, call `createDataClient`, expose context; no queue or Dexie types exported to pages. |
| **Separate API host (optional)** | Base URL and auth injection are constructor/config parameters so a future SPA + separate API origin does not fork domain code. |

### 6.5 Testing additions for Phase 6

Add to [Testing Strategy](#testing-strategy) when implementing:

- **Parity:** each new module’s behavior matches across `memory`, `online-only`, and `indexeddb` adapters for the same scenarios.
- **Portability:** automated check (grep or ESLint `no-restricted-imports`) that `packages/data-client` cannot depend on Next or `apps/app`.
- **Regression:** offline edit → reload → still local; sync online → server truth + local row reconciliation.

### 6.6 Acceptance criteria (Phase 6)

- Managers can change **settings**, **services**, **staff** (including service assignments), and **schedules** offline where product enables it, with the same queue, conflict, and visibility rules as clients/appointments.
- `createDataClient` is demonstrably usable **outside** the Next manager app (Vite or equivalent harness + CI job).
- New domains do not require changes to the **composition shape** of `DataClient` (only new modules or operations on existing modules).
- Documentation in this plan remains the source of truth for scope boundaries; out-of-scope items are listed, not implied.

---

## Phase roadmap (summary)

| Phase | Theme | Status |
|-------|--------|--------|
| 1 | Package + ports + HTTP + online-only + memory | Track in repo |
| 2 | IndexedDB adapter + local read model | Track in repo |
| 3 | Manager reads local-first | Track in repo |
| 4 | Offline writes clients + appointments | Track in repo |
| 5 | Sync UX + conflicts + auth pause | Track in repo |
| 6 | Coverage (settings, services, staff, schedule) + portability | **Next** |

After Phase 6, treat further work (bulk sync API, background sync, multi-device conflict merge) as **separate initiatives** with their own plans; [Final Guardrails](#final-guardrails) still apply.

## Testing Strategy

Repository and adapter tests:

- feature logic behaves the same with `online-only`, `indexeddb`, and `memory` adapters
- atomic local writes roll back fully on transaction failure
- queue compaction works for create/update/delete chains (including Phase 6 domains: settings, services, staff, schedule, once implemented)

Offline behavior tests:

- manager with cached session can open the app offline
- manager can create a client offline and still see it after reload
- manager can create/update/delete appointments offline and see immediate local results
- after Phase 6: each newly offline-capable entity follows the same reload survival and immediate local UI rules

Sync tests:

- reconnect/focus/bootstrap triggers sync
- conflict responses create sync issues without deleting the local draft
- auth failure pauses sync and preserves pending rows

Portability tests:

- no Next-specific, React, or `apps/app` imports exist inside `packages/data-client` (enforce with lint or `no-restricted-imports` where practical)
- the shared package can be instantiated in a non-Next browser test harness
- Phase 6: CI runs a minimal composition (`createDataClient` + HTTP stub + memory or fake IndexedDB) outside the Next workspace graph if feasible, to catch accidental coupling early

## Final Guardrails

- Do not let app pages call `fetch` directly for manager data once they are migrated to `DataClient`.
- Do not expose Dexie tables or storage-specific helpers outside the IndexedDB adapter.
- Do not let conflict handling depend on Persian error message strings.
- Do not make IndexedDB the only possible browser implementation.
- Do not add a bulk sync backend prematurely; use the current REST API first and only add server-side sync endpoints if measured pain justifies them.

## Plan completion

This document is **complete** as an architecture and phased delivery plan through Phase 6. Implementation status belongs in the issue tracker or PR history; update the [Phase roadmap](#phase-roadmap-summary) table only when a phase is genuinely done end-to-end (code, tests, UX acceptance).

**Definition of done for the offline-first initiative (Phases 1–6):** manager-critical flows work local-first with visible sync state, conflicts are reviewable, `packages/data-client` stays the sole persistence/sync abstraction for migrated surfaces, and portability is proven by a non-Next harness plus import guardrails. Further backend or product scope gets a new plan so this file does not grow without bound.
