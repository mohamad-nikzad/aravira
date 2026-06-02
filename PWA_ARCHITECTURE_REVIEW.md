# PWA Architecture Review

Findings from `/improve-codebase-architecture` on `apps/pwa` (2026-06-02).
Vocabulary: see `CONTEXT.md` (domain) and the skill's `LANGUAGE.md` (module / interface /
implementation / depth / seam / adapter / leverage / locality).

Context: the PWA has **0 unit tests** despite vitest being configured. The data layer is
where the architecture fights us. Four findings, in priority order.

---

## 1 — Unify the Offline Projection into one deep module · **Strong**

**Files:** `lib/use-calendar-indexeddb-sources.ts`, `lib/use-manager-today-indexeddb.ts`,
`lib/use-clients-indexeddb.ts` (2 hooks).

**Problem:** the Offline Projection merge logic is copied four times. Each hook re-implements
the same hydrate → read → merge state machine, including identical precedence rules:
online-but-not-loaded → show live; offline-not-loaded → show undefined; loaded → show
snapshot. A fix in one is a latent bug in the other three. CONTEXT.md already names the
concept "Offline Projection," but no single module owns it.

**Solution:** deepen one generic `useOfflineProjection<T>` parameterised by hydrate-fn,
read-fn, and entity shape. Each route declares only its sources.

**Wins:** locality (merge bugs in one module); the interface becomes the first test surface;
leverage (one interface, four call sites); deletion test passes (complexity reappears 4×).

---

## 2 — Collapse the dual write-path behind the data client · **Strong** · ✅ DONE

**Scope (corrected):** the dual write-path is concentrated in **4 files / 9 mutations**, not
66. The "66 `useMutation`" figure counted every mutation in the app; most use the raw `api`
directly and legitimately (pre-auth login/signup/onboarding, or entities not in the offline
client). The dual-path files: `components/calendar/appointment-detail-drawer.tsx` (4),
`appointment-drawer.tsx` (1), `components/calendar/client-picker.tsx` (1),
`components/clients/client-drawer.tsx` (1).

**Key finding:** the app is a pure client SPA (`ReactDOM.createRoot`, no SSR), `createDataClient`
runs whenever `window` exists, and `ManagerDataClientProvider` wraps the entire `_authed`
subtree — so `dataClient` is **never null** at those call sites. The whole
`else { api.X(); catch (ApiError) → throw DataClientHttpError }` branch (and the
`else if (err instanceof ApiError)` branches in `onError`) was **dead code**.

**What shipped:**
- `lib/manager-data-client.tsx` — new `useRequiredManagerDataClient()` seam (throws outside the provider).
- `lib/use-manager-mutation.ts` — `useManagerMutation((dc, vars) => …)` adapter: injects the
  non-null client, kicks `processPending()` on success, returns a normal `UseMutationResult` so
  the global `MutationCache` (toasts/invalidation/error) is unchanged.
- `lib/use-manager-mutation.test.tsx` — **first unit tests in the PWA** (flushes on success, not on error).
- 9 mutations across the 4 files migrated; dead `api` fallback + `ApiError` translation deleted.

**Wins realized:** error translation no longer leaks across the seam; sync-kick policy lives in
one module; drawers shrink to form + intent; the data layer now has a test surface.

**Decision (for future reviews):** sync-kick lives in the PWA `useManagerMutation` adapter, not
in `@repo/data-client` — keeps the shared package's contract unchanged and avoids kicking sync
after pre-auth mutations.

---

## 3 — Extract the Today view-model from the route · **Worth exploring**

**Files:** `routes/_authed/today.tsx` (1694 lines),
`components/calendar/appointment-detail-drawer.tsx` (1418 lines).

**Problem:** `today.tsx` mixes pure domain logic (`sortAppointments`, `groupAttentionItems`,
`summarizeNextOpenSlot`, `buildWeekStrip`), 18 presentational components, and data
orchestration. The domain logic is pure and testable but has no seam — bugs hide in how it's
called.

**Solution:** lift the pure functions into a `today-view-model.ts` module that maps Offline
Projection output to render-ready rows; the route renders it. (Consumes #1's output.)

**Wins:** interface is the test surface; locality (Today rules in one module); route drops
below ~600 lines; same move applies to the detail drawer.

---

## 4 — Collapse the manager-query subscribe boilerplate · **Worth exploring**

**Files:** `lib/manager-data-queries.ts` (5 hooks).

**Problem:** each entity hook re-wires the same `useQuery` + `useEffect → subscribe →
setQueryData` glue. The interface is nearly as complex as the implementation — shallow.

**Solution:** one `useManagerCollection(key, list, subscribe)` deep helper; entity hooks become
one-liners.

**Wins:** deletion test (glue reappears per entity); leverage (one interface, 5+ entities);
subscribe lifecycle fixed in one place.

---

## Suggested sequencing

1. **#1 Offline Projection** — foundation; lands the first unit tests; unblocks #3.
2. **#2 Single write seam** — `useManagerMutation` adapter; collapse 66 sites. _← starting here._
3. **#3 Today view-model** — consumes #1.
4. **#4 Query glue** — `useManagerCollection`.
