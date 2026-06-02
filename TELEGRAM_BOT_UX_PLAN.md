# Improve Telegram bot UX for managers

## Context

Managers approve/reject booking requests from the Telegram bot. Today the experience has gaps:

- The `/pending` list (`bot-text.ts`) shows only **name, phone, date/time** — no **service** — and has **no "open in app"** button. The live new-request notification (`appointment-request.ts`) is more complete (it has service + a link button), so the two are inconsistent.
- **Numbers are Latin** (phone `09128888888`, time `14:30`) in the messages; dates already render with Persian digits via `Intl`. Mixed LTR digits + RTL text also cause a **jagged bubble render bug on Telegram Desktop (macOS)** (the screenshot) — a bidi layout issue that doesn't reproduce on Android.
- The **"open in app" deep links are broken**: both `notify-managers.ts:26` and `approval.ts:102` point to `/appointment-requests?focus=…`, but the real manager route is **`/requests`**, which doesn't read any `focus` param.
- **Staff selection** can't be done from Telegram — multi-staff requests fall back to "open in app".

Goal: richer, prettier, correctly-rendered Telegram messages (Persian numerals, service line, bidi fix); a working "open in app" button that deep-links to `/requests` filtered to one request (with login `returnTo`); and inline staff selection inside Telegram.

Target manager app: **`apps/pwa`** (TanStack Router, route `/requests`).

## 1. Message formatting: Persian numerals, service line, bidi fix

New shared helper file `packages/notifications/src/format.ts`:
- `faDigits(v)` — re-export/wrap `toPersianDigits` from `@repo/salon-core/persian-digits`.
- `isolate(s)` — wrap an LTR run in Unicode bidi isolates: `⁨${s}⁩` (FSI…PDI). Use for phone, time, and any Latin name.
- `rtl(s)` — prefix a line with RLM `‏` to force paragraph direction RTL.

This fixes the macOS Telegram Desktop jagged-bubble bug: each line gets a leading RLM, and every LTR substring (phone, time, Latin customer name) is wrapped in an FSI/PDI isolate so the client computes line widths correctly. Persian digits further reduce bidi ambiguity. (HTML escaping in `escapeHtml` is unaffected — these are zero-width/control chars, not `&<>`.)

**`packages/notifications/src/commands/bot-text.ts` — `handlePendingCommand`** (lines ~84-101):
- Add service line `✂️ ${escapeHtml(r.bookedServiceName)}` (field already on `AppointmentRequestListItem`, no extra query).
- Phone: `📞 ${isolate(faDigits(displayPhone(r.customerPhone)))}` (`displayPhone` from `@repo/salon-core/phone`).
- Time: `ساعت ${isolate(faDigits(r.requestedStartTime))}`.
- Wrap the name line and prefix each line with `rtl(...)`.
- Add a third button row: open-in-app URL button (see §2). Requires threading `publicAppBaseUrl` into `BotTextInput` / `handlePendingCommand`.
- Persian-ize the header counts (`requests.length`) via `faDigits`.

**`packages/notifications/src/templates/appointment-request.ts`** (live notification): apply the same `faDigits`/`isolate`/`rtl` treatment to phone + time so live messages match and render correctly.

## 2. "Open in app" deep link (fix route + add to /pending)

- Add `buildRequestDeepLink(base, requestId)` to `format.ts`: `` `${base.replace(/\/$/,'')}/requests?focus=${requestId}` ``.
- Replace the broken `/appointment-requests?focus=` strings in **`approval.ts:102`** (`openInAppKeyboard`) and **`notify-managers.ts:26`** with this helper → `/requests?focus=`.
- `handlePendingCommand` builds an open-in-app button row using it; pass `PUBLIC_APP_BASE_URL` from `messaging-telegram.ts` into the pending command (it currently passes only `{provider, externalId}` at line 138-141).

## 3. Inline staff selection in Telegram

**New DB query** in `packages/database/src/internal/staff-queries.ts` (next to `findSoleCapableStaffUserId`):
`listCapableStaffForService(salonId, serviceId): Promise<{ id: string; name: string }[]>` — reuse `getAllStaff` + the same capability filter (`serviceIds == null || includes(serviceId)`), preserving its **stable `ORDER BY user.name`**. Export via the package barrel.

**Callback flow** (`approval.ts` + `messaging-telegram.ts`):
- `approve:<reqId>` tap → resolve caller, then:
  - sole capable staff → approve immediately (current behavior).
  - zero → "no staff" message + open-in-app.
  - **multiple → expand**: replace the keyboard (markup-only) with one button per staff `{ label: name, data: `asg:<reqId>:<idx>` }`, plus a final row `[ back:<reqId> , open-in-app ]`. `idx` is the position in the ordered list. Sizes: `asg:`+36+`:`+idx ≈ 43 bytes, `back:`+36 ≈ 41 bytes — both under Telegram's 64-byte `callback_data` limit.
- `asg:<reqId>:<idx>` tap → `handleAssignCallback`: re-fetch `listCapableStaffForService` (same ordering), pick `[idx]`; if out of range (list changed since render) → error toast + open-in-app; else `approveAppointmentRequest({ staffId })` and edit message to the success text, dropping the keyboard.
- `back:<reqId>` tap → `handleBackCallback`: restore the original approve/reject/open-in-app keyboard (markup-only).

**Markup-only edits**: add `editTelegramMessageReplyMarkup(...)` to `providers/telegram.ts` (grammY `editMessageReplyMarkup`) and a `mode: 'text' | 'markup'` field (or `keyboardOnly: boolean`) on `CallbackOutcome` so the expand/back steps swap buttons without re-deriving the message body.

**Parser/dispatch**: extend `CALLBACK_DATA_RE` and `parseCallbackData` in `messaging-telegram.ts` to also match `asg:<uuid>:<idx>` and `back:<uuid>`, and route to the new handlers.

## 4. PWA: focus-filter on /requests + login returnTo

**`apps/pwa/src/routes/_authed/requests.tsx`**:
- Add `validateSearch` for `{ focus?: string }`.
- When `focus` is set: force the `pending` tab and filter the list to just that request id. Show a banner "نمایش یک درخواست" with a "نمایش همه" action that clears `focus` (`navigate({ to: '/requests' })`). If the focused request isn't in the pending set (already decided/expired), show "این درخواست دیگر در انتظار نیست" + link to all.
- Optionally highlight/scroll the matched `PendingCard`.

**Login returnTo (preserve query string)** — currently `_authed.tsx` stores only `location.pathname`, dropping `?focus=…`:
- `apps/pwa/src/routes/_authed.tsx` (~line 24): change `redirect: location.pathname` → the full relative URL incl. search (`location.href`).
- `apps/pwa/src/routes/login.tsx`: `beforeLoad` and `onSuccess` consume `search.redirect`; navigate so the query survives (e.g. `navigate({ href: redirectTo })` / parse the string). **Guard**: only honor `redirect` values that start with `/` (internal) to avoid open-redirect.

So an unauthenticated tap on the Telegram button → `/login?redirect=/requests?focus=<id>` → after login lands on `/requests?focus=<id>`.

## 5. Prettier /today + /pending spacing

**`handleTodayCommand`** (`bot-text.ts` ~117-137): bold date header, a blank spacer line, per-appointment lines with Persian-digit times wrapped in `isolate`, and a Persian-digit overflow count. Keep manager vs staff who-line logic.

**`handlePendingCommand`**: blank-line separators between fields within each request bubble for breathing room; Persian-digit header count.

## Critical files

- `packages/notifications/src/format.ts` (new — bidi/digit/deep-link helpers)
- `packages/notifications/src/commands/bot-text.ts` (service line, Persian, spacing, open-in-app)
- `packages/notifications/src/commands/approval.ts` (staff expand / assign / back)
- `packages/notifications/src/templates/appointment-request.ts` (Persian + bidi)
- `packages/notifications/src/notify-managers.ts` (deep-link route fix)
- `packages/notifications/src/providers/telegram.ts` (`editTelegramMessageReplyMarkup`)
- `packages/database/src/internal/staff-queries.ts` (`listCapableStaffForService`)
- `apps/api/src/routes/messaging-telegram.ts` (callback parse/dispatch, pass base URL)
- `apps/pwa/src/routes/_authed/requests.tsx` (focus filter)
- `apps/pwa/src/routes/_authed.tsx`, `apps/pwa/src/routes/login.tsx` (returnTo w/ search)

## Verification

- **Unit (vitest, `packages/notifications`)**: tests for callback parsing (`approve`/`reject`/`asg:<uuid>:<idx>`/`back`), `buildRequestDeepLink`, and the formatter helpers (Persian digits + bidi isolation present). Run the notifications test suite.
- **Type/build**: typecheck `packages/notifications`, `apps/api`, `apps/pwa`.
- **PWA manual** (`pnpm dev:pwa`, port 3000): visit `/requests?focus=<pendingId>` → only that request shown + banner; "نمایش همه" clears it. Logged out → `/login?redirect=/requests?focus=<id>` round-trips after login. Decided id → "no longer pending" message.
- **Telegram (manual, needs bot token/webhook)**: `/pending` shows service + Persian phone/time + open-in-app; verify the macOS Desktop bubble renders cleanly (bidi fix). Tap تأیید on a multi-staff service → staff buttons appear → tap one approves+assigns; back button restores. `/today` spacing + Persian times. If a live bot env isn't available, state that the Telegram side was verified via unit tests only.
