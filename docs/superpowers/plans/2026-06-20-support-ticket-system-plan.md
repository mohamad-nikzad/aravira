# Support Ticket System — Implementation Plan

**Date:** 2026-06-20
**Backlog item:** [`../../../backlog/ready/BL-0023-support-ticket-system.md`](../../../backlog/ready/BL-0023-support-ticket-system.md)
**Estimated slices:** 8 dependency-ordered tasks; Tasks 1–4 are the backend foundation, Tasks 5–6 are the manager PWA, and Task 7 is the admin inbox.

## Goal and non-goals

Ship one salon-scoped Support Ticket conversation system with two surfaces:

- Managers create, list, read, and answer their salon's tickets in the PWA.
- Authorized platform users read and operate the shared inbox in the admin app.
- Message authorship drives status transitions; clients never submit a desired status.
- Manager unread state is shared at salon/ticket level, not per manager.
- Platform replies fan out existing in-app notifications to managers, but notification rows do not determine the Support badge.
- Feature-request tickets remain Support Tickets only. No code in this feature writes to `backlog/`, creates engineering issues, or introduces a product-work relation.

Do not add attachments, priorities, assignment, internal ticket notes, message mutation, email/SMS/push delivery, or staff access.

## Read before starting

- `CONTEXT.md` — canonical Support Ticket language and lifecycle.
- `backlog/ready/BL-0023-support-ticket-system.md` — scope and acceptance criteria.
- `packages/database/src/schema.ts` and `packages/database/src/admin.ts` — schema and admin list/audit conventions.
- `packages/auth/src/platform.ts`, `packages/auth/src/tenant.ts`, and `apps/api/src/middleware/auth.ts` — explicit permission gates.
- `apps/api/src/routes/admin.ts` and `apps/api/src/openapi/routes/admin.ts` — admin mutation, audit metadata, pagination, and contract patterns.
- `packages/database/src/internal/notification-queries.ts` and `packages/notifications/src/notify-managers.ts` — existing notification and manager-fanout behavior.
- `apps/pwa/src/routes/_authed/settings.tsx`, `apps/pwa/src/components/settings/settings-rows.tsx`, and `apps/pwa/src/components/bottom-nav.tsx` — More hub and badge patterns.
- `apps/admin/src/components/layout/admin-topbar.tsx`, `apps/admin/src/lib/platform-rbac.ts`, and `apps/admin/src/features/audit-log/index.tsx` — admin header, route guards, and list UI patterns.

## Fixed domain decisions

These decisions remove ambiguity for implementing agents.

### Lifecycle transition table

| Command                          | Actor           | Previous status                 | Resulting status      |
| -------------------------------- | --------------- | ------------------------------- | --------------------- |
| Create ticket with first message | manager         | —                               | `open`                |
| Add message                      | manager         | any                             | `open`                |
| Add message                      | platform writer | `open` or `waiting_for_manager` | `waiting_for_manager` |
| Add message                      | platform writer | `resolved`                      | `open`                |
| Reply and resolve                | platform writer | any                             | `resolved`            |
| Resolve without a reply          | platform writer | any                             | `resolved`            |

The resolved-message rule takes precedence over authorship: **any** ordinary message on a resolved ticket reopens it to `open`. A platform writer who wants to answer and finish the conversation must use the atomic `replyAndResolve` command.

There is no generic client-controlled status endpoint. The only explicit status command in v1 is `resolve`.

### Identity and presentation

- Derive `authorKind` (`manager` or `platform`) from the authenticated endpoint, never from request JSON.
- Store `authorUserId` for every message and an `authorDisplayNameSnapshot` captured at send time.
- Manager responses expose manager snapshots normally but replace every platform author's display name with `پشتیبانی سالونا`.
- Admin responses expose the real stored author name and user ID for both sides.
- Messages have no `updatedAt`, edit route, or delete route.

### Shared unread model

Store two cursors on each ticket:

- `managerLastReadAt`: advanced when any manager opens the ticket; compare it with `lastPlatformMessageAt`.
- `platformLastReadAt`: advanced when any platform reader opens the ticket; compare it with `lastManagerMessageAt`.

`managerHasUnread = lastPlatformMessageAt != null && (managerLastReadAt == null || managerLastReadAt < lastPlatformMessageAt)`.

`platformHasUnread = lastManagerMessageAt != null && (platformLastReadAt == null || platformLastReadAt < lastManagerMessageAt)`.

Creation sets `managerLastReadAt` to the creation time and leaves `platformLastReadAt` null, so a new ticket is immediately new for the admin inbox but not unread for its authoring salon. These are salon-shared/platform-shared ticket cursors. Do not calculate the PWA badge from the existing per-user `notifications.readAt` column.

### Validation and list limits

- Category: `problem | question | feature_request | other`.
- Subject: trimmed, required, 1–120 Unicode characters.
- Message body: trimmed, required, 1–4,000 Unicode characters.
- Ticket lists: page/pageSize pagination, default 25, maximum 100.
- Conversation messages: chronological ascending; v1 may return the full conversation with a hard database limit of 500. If the limit is reached, return `truncated: true` so a later cursor-paging enhancement is possible without silently hiding history.

## Target API surface

### Manager API — `/api/v1/support-tickets`

| Method | Path                  | Permission               | Behavior                                                                                    |
| ------ | --------------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `GET`  | `/`                   | `view_support_tickets`   | Salon-scoped list; newest activity first; includes shared unread summary.                   |
| `POST` | `/`                   | `manage_support_tickets` | Atomically creates ticket and first manager message.                                        |
| `GET`  | `/:ticketId`          | `view_support_tickets`   | Returns salon-scoped detail without mutating read state.                                    |
| `POST` | `/:ticketId/messages` | `manage_support_tickets` | Adds manager message and applies lifecycle transition.                                      |
| `POST` | `/:ticketId/read`     | `view_support_tickets`   | Idempotently advances shared manager read cursor; useful for refetch/retry.                 |
| `GET`  | `/summary`            | `view_support_tickets`   | Returns `{ unreadCount }` for More-row and bottom-nav badges. Register before `/:ticketId`. |

Staff must receive `403` from every manager Support route. All database reads also require `salonId`, preventing cross-salon ID access even if route middleware regresses.

### Admin API — `/api/v1/admin/support-tickets`

| Method | Path                  | Permission                | Behavior                                                                           |
| ------ | --------------------- | ------------------------- | ---------------------------------------------------------------------------------- |
| `GET`  | `/`                   | `view_support_tickets`    | Paginated inbox; default unresolved/newest activity; filters and search.           |
| `GET`  | `/summary`            | `view_support_tickets`    | Returns unresolved and unread counts for the header. Register before `/:ticketId`. |
| `GET`  | `/:ticketId`          | `view_support_tickets`    | Returns detail with real authors without mutating read state.                      |
| `POST` | `/:ticketId/read`     | `view_support_tickets`    | Idempotently advances shared platform read cursor.                                 |
| `POST` | `/:ticketId/messages` | `reply_support_tickets`   | Adds platform reply; accepts `{ body, resolveAfter?: boolean }`.                   |
| `POST` | `/:ticketId/resolve`  | `resolve_support_tickets` | Resolves without adding a message; idempotent if already resolved.                 |

Admin list query parameters:

```ts
type AdminSupportTicketListQuery = {
  page?: number
  pageSize?: number
  status?: 'open' | 'waiting_for_manager' | 'resolved'
  category?: SupportTicketCategory
  salonId?: string
  search?: string // subject OR salon name, case-insensitive
  scope?: 'unresolved' | 'all' // default: unresolved; ignored when status is set
}
```

Order by `lastActivityAt DESC, id DESC` for stable pagination. Manager lists use the same ordering but need no v1 filters.

## Task order

```text
Task 1  Domain schemas, permissions, and pure lifecycle tests
   ↓
Task 2  Database tables, migration, atomic commands, and list queries
   ↓
Task 3  Manager/admin API routes, audit events, and notification fanout
   ↓
Task 4  OpenAPI registration and generated client
   ├───────────────┐
   ↓               ↓
Task 5  PWA data   Task 7  Admin inbox + header
   ↓
Task 6  PWA screens + badges
   └───────────────┘
           ↓
Task 8  Cross-surface verification and acceptance pass
```

Tasks 5 and 7 can be implemented in parallel after Task 4. Do not split Task 2's ticket/message transaction across PRs: the lifecycle invariant must exist before either UI can write data.

---

## Task 1 — Domain contracts and explicit permissions

### 1.1 Add Support schemas and transition logic

**New file:** `packages/salon-core/src/support-tickets.ts`

Export:

```ts
export const supportTicketCategories = [
  'problem',
  'question',
  'feature_request',
  'other',
] as const
export type SupportTicketCategory = (typeof supportTicketCategories)[number]

export const supportTicketStatuses = [
  'open',
  'waiting_for_manager',
  'resolved',
] as const
export type SupportTicketStatus = (typeof supportTicketStatuses)[number]
export type SupportMessageAuthorKind = 'manager' | 'platform'

export function statusAfterMessage(
  current: SupportTicketStatus,
  author: SupportMessageAuthorKind,
): SupportTicketStatus
```

Also export Zod request schemas for create ticket, create message, platform reply (`resolveAfter` optional), resolve params, and list filters. Re-export them from `packages/salon-core/src/index.ts` or the package's established subpath pattern.

**New test:** `packages/salon-core/src/support-tickets.test.ts`

- [ ] All four create categories validate; unknown category fails.
- [ ] Subject and body trim and enforce their limits.
- [ ] Manager message produces `open` from all three statuses.
- [ ] Platform message produces `waiting_for_manager` from non-resolved states.
- [ ] Platform message on `resolved` produces `open`.
- [ ] `resolveAfter` is accepted only on the platform reply schema.

### 1.2 Add explicit tenant permissions

**File:** `packages/auth/src/tenant.ts`

- [ ] Add `view_support_tickets` and `manage_support_tickets`.
- [ ] Grant both only to mapped tenant role `manager`; grant neither to `staff`.
- [ ] Extend permission tests with manager-allowed/staff-denied cases.

### 1.3 Add explicit platform permissions

**File:** `packages/auth/src/platform.ts`

- [ ] Add `view_support_tickets`, `reply_support_tickets`, and `resolve_support_tickets`.
- [ ] Owners, admins, and support users receive all three.
- [ ] Viewers receive only `view_support_tickets`.
- [ ] Extend `packages/auth/src/platform.test.ts` and `apps/admin/src/lib/platform-rbac.test.ts`.

Do not infer Support access from role order or reuse the unrelated `view_support_lookup` permission.

### 1.4 Verify

```bash
pnpm --filter @repo/salon-core test
pnpm --filter @repo/salon-core typecheck
pnpm --filter @repo/auth test
pnpm --filter @repo/auth typecheck
```

---

## Task 2 — Persistence and transactional domain operations

### 2.1 Add tables

**File:** `packages/database/src/schema.ts`

Add `supportTickets`:

```ts
{
  id: uuid PK,
  salonId: uuid FK organization RESTRICT,
  submittedByUserId: uuid FK user RESTRICT,
  category: text SupportTicketCategory,
  subject: text,
  status: text SupportTicketStatus default 'open',
  lastActivityAt: timestamptz,
  lastManagerMessageAt: timestamptz nullable,
  lastPlatformMessageAt: timestamptz nullable,
  managerLastReadAt: timestamptz nullable,
  platformLastReadAt: timestamptz nullable,
  resolvedAt: timestamptz nullable,
  resolvedByUserId: uuid FK user RESTRICT nullable,
  createdAt: timestamptz,
}
```

Add `supportMessages`:

```ts
{
  id: uuid PK,
  ticketId: uuid FK supportTickets CASCADE,
  authorUserId: uuid FK user RESTRICT,
  authorKind: text SupportMessageAuthorKind,
  authorDisplayNameSnapshot: text,
  body: text,
  createdAt: timestamptz,
}
```

Required indexes:

- [ ] Tickets `(salon_id, last_activity_at DESC)` for manager lists.
- [ ] Tickets `(status, last_activity_at DESC)` for default admin inbox/header count.
- [ ] Tickets `(category, last_activity_at DESC)` and `(salon_id, status)` for filters.
- [ ] Messages `(ticket_id, created_at ASC, id ASC)`.
- [ ] Add Postgres trigram indexes for case-insensitive subject/organization-name search only if the project already enables `pg_trgm`; otherwise use escaped `ILIKE` for v1 and record the performance follow-up.

Generate, inspect, and commit the migration:

```bash
pnpm db:generate
pnpm db:check
```

Never hand-edit the generated migration snapshot unless the repository's migration reconciliation tooling requires it.

### 2.2 Add a public database module

**New files:**

- `packages/database/src/internal/support-ticket-queries.ts`
- `packages/database/src/support-tickets.ts`

The public file re-exports types and operations; API code must not import the internal file.

Implement these commands/queries:

```ts
createSupportTicket(input)
listSalonSupportTickets(input)
getSalonSupportTicketDetail(input)
markSupportTicketReadByManager(input)
addManagerSupportMessage(input)

listAdminSupportTickets(input)
getAdminSupportTicketDetail(ticketId)
getAdminSupportTicketSummary()
markSupportTicketReadByPlatform(input)
addPlatformSupportMessage(input) // includes resolveAfter
resolveSupportTicket(input)
listActiveSalonManagerUserIds(salonId)
```

### 2.3 Enforce atomic write invariants

Each create/message/resolve command must run in one database transaction.

- [ ] Lock the ticket row before computing a transition (`SELECT … FOR UPDATE`) so concurrent manager/platform messages cannot overwrite each other's status or activity timestamps.
- [ ] Create ticket + first message atomically using one captured `now` value.
- [ ] Insert message and update ticket timestamps/status atomically.
- [ ] Manager message: set `lastManagerMessageAt` and `lastActivityAt`; status `open`; do not advance `platformLastReadAt`.
- [ ] Platform ordinary reply: set `lastPlatformMessageAt` and `lastActivityAt`; set `waiting_for_manager`, except resolved tickets reopen to `open`; do not advance `managerLastReadAt`.
- [ ] Reply-and-resolve: insert message, set `lastPlatformMessageAt`, `lastActivityAt`, status `resolved`, `resolvedAt`, and `resolvedByUserId` in the same transaction.
- [ ] Resolve-only: preserve `lastActivityAt` because no conversation activity occurred; set resolution fields and status. Return `changed: false` when already resolved.
- [ ] Any reopening transition clears `resolvedAt` and `resolvedByUserId`.
- [ ] Manager reads always include `ticket.salonId = tenant.salonId` in the query/update predicate.
- [ ] Read-cursor updates use a monotonic `GREATEST(existing, now)` expression and are idempotent.

For every mutation return the previous and resulting status plus created entities. The API needs this to write precise audit metadata without re-querying.

### 2.4 Query projections

Return separate manager/admin projections instead of leaking one wide database object:

- Manager list: ticket metadata, status/category, `lastActivityAt`, `managerHasUnread`, and a short last-message preview with platform identity already aliased.
- Manager detail: ticket + messages; platform `authorUserId` and real display name must not leave the server projection.
- Admin list: salon ID/name, submitter snapshot, status/category, last activity, `platformHasUnread`.
- Admin detail: real author IDs/names, resolution actor/time, and all messages.

### 2.5 Database tests

**New test:** `packages/database/src/internal/support-ticket-queries.test.ts`

- [ ] Create persists ticket and first message together.
- [ ] Salon A cannot read/update Salon B's ticket.
- [ ] Transition matrix matches Task 1, including resolved reopening.
- [ ] Reply-and-resolve ends resolved rather than waiting.
- [ ] Resolve-only is idempotent.
- [ ] Read cursors advance and shared unread flags flip for every manager/platform reader.
- [ ] Messages return chronological and remain immutable by API surface.
- [ ] Default admin list excludes resolved and sorts newest activity first.
- [ ] Status/category/salon filters and escaped subject/salon-name search work.
- [ ] Summary counts unresolved and unread independently.

Use the repository's database-test pattern if a real test database is available; otherwise unit-test the pure transition logic in Task 1 and cover query behavior through API mocks plus one migration smoke test.

---

## Task 3 — HTTP routes, auditing, and in-app notification fanout

### 3.1 Manager routes

**New file:** `apps/api/src/routes/support-tickets.ts`

- [ ] Apply `requireTenant('view_support_tickets')` to read routes and `requireTenant('manage_support_tickets')` to writes.
- [ ] Pass `c.var.tenant.salonId` and `userId` into every database operation.
- [ ] Obtain the manager display name from the authenticated salon membership; use `salonMember.displayName`, falling back to `user.name`.
- [ ] Return `404`, not `403`, for a ticket ID outside the tenant scope.
- [ ] Register `/summary` before `/:ticketId`.
- [ ] Creation returns `201`; message creation returns `201`; reads/resolve return `200`.

**File:** `apps/api/src/app.ts`

- [ ] Mount at `/api/v1/support-tickets`.

**New test:** `apps/api/src/routes/support-tickets.test.ts`

- [ ] `401` unauthenticated; `403` staff; manager succeeds.
- [ ] Request bodies reject bad category/empty/oversize values.
- [ ] All calls carry authenticated salon/user identity rather than body identity.
- [ ] Cross-salon/missing IDs return `404`.
- [ ] Detail GET is side-effect free; the explicit read endpoint advances the shared cursor.

### 3.2 Admin routes

Prefer a dedicated **new file** `apps/api/src/routes/admin-support-tickets.ts`, mounted under `/api/v1/admin/support-tickets`, rather than making the already-large `admin.ts` larger.

- [ ] Apply `requirePlatformAdmin('view_support_tickets')` to the router/read endpoints.
- [ ] Apply `reply_support_tickets` and `resolve_support_tickets` again on their specific write endpoints.
- [ ] A viewer can list/read and trigger the shared read cursor, but receives `403` for reply/resolve.
- [ ] Capture request ID/IP/user-agent with the existing `auditMeta` convention; extract a shared helper if needed instead of copying subtly different logic.

**New test:** `apps/api/src/routes/admin-support-tickets.test.ts`

- [ ] Owner/admin/support can reply and resolve.
- [ ] Viewer can list/detail but cannot mutate.
- [ ] Default/filter/search query parsing maps correctly to database input.
- [ ] `resolveAfter` uses the single atomic database command.
- [ ] Missing ticket returns `404`.

### 3.3 Audit events

After successful platform mutations, call the existing `createAdminAuditEvent` with the real authenticated platform user and role:

| Action                           | Target                         | Required metadata                                                          |
| -------------------------------- | ------------------------------ | -------------------------------------------------------------------------- | -------- |
| `support_ticket.message_created` | message ID / `support_message` | `ticketId`, `salonId`, `previousStatus`, `resultingStatus`, `resolveAfter` |
| `support_ticket.status_changed`  | ticket ID / `support_ticket`   | `previousStatus`, `resultingStatus`, `source: reply_and_resolve            | resolve` |

- [ ] An ordinary reply always writes `message_created`; if it reopens a resolved ticket, also write `status_changed`.
- [ ] Reply-and-resolve writes both events.
- [ ] Resolve-only writes `status_changed` only when `changed: true`.
- [ ] Store no full message body in audit metadata; ticket/message IDs are sufficient and avoid duplicating potentially sensitive support content.
- [ ] Manager-authored messages do not enter the admin audit log; their immutable message rows already record authorship.

Audit insertion follows the existing post-mutation convention. If the team later requires audit/database all-or-nothing guarantees, move both behind a shared transaction boundary as a separate hardening change rather than hiding that architectural change in this feature.

### 3.4 Manager notification fanout

On a successful platform message, after the support transaction commits:

- [ ] Find all active managers for the salon (`member.role IN ('owner', 'admin')`, active salon membership where applicable).
- [ ] Create one existing in-app notification per manager with new type `support_reply`, route `/support/:ticketId`, and data `{ ticketId }`.
- [ ] Extend the notification type union in both `packages/database/src/schema.ts` and `packages/database/src/internal/notification-queries.ts`.
- [ ] Dispatch only the `in_app` channel in v1. Do not consult appointment-alert preferences and do not send push/SMS/email.
- [ ] Notification failure must be observable/logged but must not roll back a committed platform reply. Use `Promise.allSettled` or an existing resilient fanout helper.
- [ ] Do not create a second notification for resolve-only without a reply.

The PWA Support badges still come from `/support-tickets/summary`; per-user notifications are merely the in-app alert record.

---

## Task 4 — OpenAPI contract and generated clients

### 4.1 Schemas and routes

**New files:**

- `apps/api/src/openapi/schemas/support-tickets.ts`
- `apps/api/src/openapi/routes/support-tickets.ts`
- `apps/api/src/openapi/routes/admin-support-tickets.ts`

Define explicit manager and admin response schemas. The manager message schema must be structurally incapable of returning a platform author's real ID/name.

### 4.2 Contract registration

**File:** `apps/api/src/openapi/contract-app.ts`

- [ ] Register all manager and admin routes with typed stubs.
- [ ] Ensure static `/summary` registrations precede parameter routes.
- [ ] Include `400`, `401`, `403`, and `404` responses consistently.

### 4.3 Generate and inspect

```bash
pnpm generate:api-contract
pnpm generate:api-client
pnpm --filter @repo/api-client test
pnpm --filter @repo/api-client typecheck
```

Inspect the generated diff. Confirm that manager/admin operations have distinct names, list query types include all filters, and no internal platform identity appears in manager response types.

---

## Task 5 — PWA query layer and route authorization

### 5.1 Query/mutation helpers

**New file:** `apps/pwa/src/lib/support-ticket-queries.ts`

Wrap generated options and mutations:

- `supportTicketListQueryOptions()`
- `supportTicketSummaryQueryOptions()`
- `supportTicketDetailQueryOptions(ticketId)`
- `useCreateSupportTicketMutation()`
- `useAddManagerSupportMessageMutation(ticketId)`
- `useMarkSupportTicketReadMutation(ticketId)`

Invalidation rules:

- Create: invalidate list + summary; seed/navigate to returned detail.
- Message: invalidate detail + list + summary.
- Detail/read: update or invalidate detail/list + summary so all visible badges clear.
- Poll list/summary every 60 seconds while the app is focused, matching the existing appointment-request badge cadence.

### 5.2 Manager route guards

Create these file routes:

- `apps/pwa/src/routes/_authed/support.tsx` — layout/manager guard.
- `apps/pwa/src/routes/_authed/support.index.tsx` — salon ticket list.
- `apps/pwa/src/routes/_authed/support.new.tsx` — create flow.
- `apps/pwa/src/routes/_authed/support.$ticketId.tsx` — conversation.

Use a route-level manager check in addition to hiding links. Staff navigation or a typed URL must redirect to `/today` (the API remains the authority and returns `403`). Regenerate `apps/pwa/src/routeTree.gen.ts` via the normal TanStack Router dev/build workflow; do not edit it by hand.

### 5.3 Query tests

**New test:** `apps/pwa/src/lib/support-ticket-queries.test.tsx`

- [ ] Query keys are ticket-specific where required.
- [ ] Create/reply/read mutations invalidate list, detail, and summary correctly.
- [ ] Failed writes preserve draft text for retry.

---

## Task 6 — Manager Support experience

### 6.1 More hub and bottom-nav unread badge

**Files:**

- `apps/pwa/src/routes/_authed/settings.tsx`
- `apps/pwa/src/components/bottom-nav.tsx`

- [ ] Add manager-only `پشتیبانی` Settings row linking to `/support`.
- [ ] Show the shared unread count badge on that row.
- [ ] Add `/support` to the More nav item's `matchPrefixes`.
- [ ] Show the same unread count on the More icon; do not add a sixth primary tab.
- [ ] Disable the summary query for staff and onboarding routes.
- [ ] Render `99+` consistently for large counts and Persian digits if that is the surrounding UI convention.

### 6.2 Ticket list

**Suggested new components:** `apps/pwa/src/components/support/`

- `support-ticket-list.tsx`
- `support-ticket-card.tsx`
- `support-ticket-status.tsx`
- `support-ticket-empty.tsx`

Behavior:

- [ ] Newest activity first.
- [ ] Show subject, localized category/status, last activity, preview, and unread emphasis.
- [ ] Provide empty, loading, error/retry, and pagination/load-more states.
- [ ] Primary action opens `/support/new`.

Use these Persian labels unless product copy supplies replacements:

```text
problem → مشکل
question → پرسش
feature_request → پیشنهاد قابلیت
other → سایر
open → باز
waiting_for_manager → منتظر پاسخ شما
resolved → حل‌شده
```

### 6.3 Create flow

**Suggested component:** `apps/pwa/src/components/support/support-ticket-create-form.tsx`

- [ ] Required category control, subject input with 120-character counter, and first-message textarea with 4,000-character counter.
- [ ] Use `react-hook-form` + shared Zod schema and existing Form/Sheet conventions.
- [ ] Prevent duplicate submit, preserve draft after failure, show field/server errors, and navigate to the created conversation on success.
- [ ] Do not expose salon, submitter, status, priority, or feature-acceptance controls.

### 6.4 Conversation detail

**Suggested components:**

- `support-ticket-thread.tsx`
- `support-message-bubble.tsx`
- `support-message-composer.tsx`

- [ ] Show ticket subject/category/status and immutable chronological messages.
- [ ] Manager messages show their captured individual names.
- [ ] All platform messages show exactly `پشتیبانی سالونا`.
- [ ] Mark read after a successful detail load; treat the command as idempotent.
- [ ] Keep replying enabled on resolved tickets and explain that sending reopens the ticket.
- [ ] Clear the composer only after a successful mutation; scroll/focus the new message.
- [ ] Render `truncated` warning defensively if the 500-message cap is reached.
- [ ] No edit/delete, attachment, priority, or resolve controls.

### 6.5 PWA tests

Add route/component tests covering:

- [ ] Manager sees Support row; staff does not.
- [ ] Shared unread count appears on Support and More.
- [ ] List states and unread styling.
- [ ] Create validation and success navigation.
- [ ] Platform identity alias and manager identity display.
- [ ] Resolved reply copy/reopen behavior.
- [ ] Staff typed-route redirect.

---

## Task 7 — Admin inbox, conversation, and header indicator

### 7.1 Admin query layer

**New file:** `apps/admin/src/features/support-tickets/support-ticket-queries.ts`

Wrap generated admin queries/mutations. Use URL search state for page, search, status, category, salon, and scope so filtered inboxes are shareable and back/forward-safe.

Invalidation rules:

- Detail/read: detail + inbox + header summary.
- Reply/resolve: detail + inbox + header summary + audit-log queries.
- Poll header summary every 60 seconds while focused.

### 7.2 Header and route wiring

**Files:**

- `apps/admin/src/components/layout/admin-topbar.tsx`
- `apps/admin/src/components/layout/nav-items.ts`
- `apps/admin/src/lib/platform-rbac.ts`
- `apps/admin/src/components/command-menu.tsx`

- [ ] Add a ticket icon button with unresolved count; clicking opens `/support-tickets`.
- [ ] Give unread/new activity a visual dot distinct from the unresolved count.
- [ ] Hide the icon/nav/command entry without `view_support_tickets`.
- [ ] Add `/support-tickets` route permission mapping.

Create:

- `apps/admin/src/routes/_admin/support-tickets.tsx`
- `apps/admin/src/routes/_admin/support-tickets.$ticketId.tsx` if using a full detail page; alternatively keep selection in URL search and use a responsive split-pane.

Regenerate `apps/admin/src/routeTree.gen.ts` normally; do not hand-edit it.

### 7.3 Inbox

**New directory:** `apps/admin/src/features/support-tickets/`

Suggested modules:

- `index.tsx`
- `support-ticket-columns.tsx`
- `support-ticket-filters.tsx`
- `support-ticket-detail.tsx`
- `support-ticket-reply-form.tsx`
- `support-ticket-url-state.ts`

Behavior:

- [ ] Default scope is unresolved, ordered newest activity.
- [ ] Status, category, and salon filters map to URL/query parameters.
- [ ] Debounced search matches subject and salon name.
- [ ] Unread manager activity is visually distinct.
- [ ] Resolved tickets remain reachable by selecting resolved/all.
- [ ] Empty/error/loading/pagination states use existing admin components.
- [ ] Salon names link to existing salon detail where permission allows.

### 7.4 Admin conversation and operations

- [ ] Show real author name/ID internally, author side, timestamps, and immutable messages.
- [ ] Opening detail advances platform shared read state and clears header/inbox new marker after invalidation.
- [ ] Owner/admin/support see reply composer and resolve action; viewer sees read-only detail.
- [ ] Reply form offers two explicit actions: `ارسال پاسخ` and `ارسال و حل کردن`.
- [ ] Resolve-only action requires confirmation but no invented priority/assignment/reason field.
- [ ] After mutation, show resulting status from the server; do not reproduce lifecycle logic in the UI.
- [ ] Feature-request resolution copy says only the conversation is resolved and does not imply product commitment.

### 7.5 Admin tests

- [ ] Header shows unresolved count and unread dot from summary.
- [ ] Default query is unresolved/newest; filters/search serialize correctly.
- [ ] Viewer has no mutation controls and route guards reject writes.
- [ ] Reply and reply-and-resolve send distinct payloads.
- [ ] Resolve invalidates inbox, detail, summary, and audit log.
- [ ] Real platform author is visible only on the admin projection.

---

## Task 8 — Verification and rollout

### 8.1 Automated checks

Run focused checks during each task, then the repository gates:

```bash
pnpm db:check
pnpm generate:api-contract
pnpm generate:api-client
pnpm --filter @repo/salon-core test
pnpm --filter @repo/auth test
pnpm --filter @repo/database typecheck
pnpm --filter @repo/api test
pnpm --filter @repo/api typecheck
pnpm --filter @repo/api-client test
pnpm --filter @repo/pwa test
pnpm --filter @repo/pwa typecheck
pnpm --filter @repo/admin test
pnpm --filter @repo/admin typecheck
pnpm lint
pnpm boundaries
```

If generated contract/client files change after the final generation pass, commit them with the implementation.

### 8.2 Manual end-to-end matrix

Use two salon managers, one staff user, and one user for each platform role.

1. Manager A creates each category; Manager B immediately sees the salon ticket.
2. Staff cannot see the row/route and receives `403` from direct API calls.
3. Admin inbox shows the new unread ticket and increments unresolved count.
4. Platform viewer opens it, clearing shared admin unread, but cannot reply/resolve.
5. Platform support replies; status becomes `waiting_for_manager`; both managers receive in-app notification records.
6. Manager A opens it; Support/More unread clears for Manager A **and Manager B** after refetch.
7. Manager B replies; status becomes `open`; admin new marker returns.
8. Platform support uses reply-and-resolve; exactly one platform message is added and status ends `resolved`.
9. Manager replies to the resolved ticket; it reopens to `open`.
10. Platform admin resolves without a reply; no manager reply notification is created.
11. Filter/search resolved tickets by status, category, salon, subject, and salon name.
12. Verify audit log real actor/action/transition metadata for platform reply/reopen/resolve operations.
13. Resolve a `feature_request`; verify no issue/backlog/product record is created or changed.
14. Race two replies (manager/platform) against the same ticket and confirm the final state follows serialized commit order with no lost message.

### 8.3 Visual and accessibility pass

- [ ] Verify PWA at narrow mobile width, RTL message alignment, keyboard-safe composer, focus return, and dark mode.
- [ ] Verify admin at desktop and narrow widths, filter wrapping, long Persian subjects/messages, and dark mode.
- [ ] All icon-only actions have accessible labels; status/unread is not conveyed by color alone.
- [ ] Loading state does not flash a false zero badge; errors expose retry rather than silently hiding Support activity.

## Definition of done

- Every acceptance criterion in BL-0023 has a corresponding automated test or a recorded manual check above.
- Database lifecycle transitions are transactional and covered by the complete transition matrix.
- Tenant isolation and every platform/tenant role combination are tested at HTTP boundaries.
- Manager responses cannot expose a platform actor's real identity.
- Admin audit events retain the real platform actor for reply and status transitions.
- PWA Support unread is demonstrably salon-shared.
- Admin default inbox, count, filters, ordering, and search match the backlog item.
- Generated migration, OpenAPI contract, client code, route trees, and tests are committed together.
- No out-of-scope delivery channel or product-backlog automation is introduced.
