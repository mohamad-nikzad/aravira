# Native Push Notifications — Remaining Work

The native app currently ships only a local preferences UI for push (`apps/native/app/push-settings.tsx`). The toggle stores `native:push-enabled` in `AsyncStorage` and provides a deep-link to OS settings. No device token is requested, no subscription is registered with the backend, and the backend cannot deliver to native devices yet.

This document lists everything still required to make native push fully functional, and why each piece is needed.

## Current state

- **Native app**: Local-only toggle screen. No `expo-notifications`, no token request, no subscribe call.
- **Backend push pipeline**: Web Push (VAPID) only. Routes `/api/push/config` and `/api/push/subscribe` expect a browser `PushSubscription` with `endpoint`, `p256dh`, `auth`. Sends use the `web-push` library against the stored endpoints.
- **Database**: `push_subscriptions` table (`packages/database/src/schema.ts:293`) is shaped for Web Push: `endpoint`, `p256dh`, `auth`. No column for platform (`ios`/`android`/`web`) or Expo push token / native device token.

## Remaining work

### 1. Native dependency + config

- Add `expo-notifications` (and `expo-device`, `expo-constants` already present) to `apps/native/package.json`.
- For Android, add `google-services.json` and configure `expo.android.googleServicesFile` in `app.config` so FCM credentials are bundled.
- For iOS, configure APNS in the Apple developer portal and ensure the Expo project has a push key uploaded (`eas credentials`).
- Add `expo.notification` icon/color (Android) and `aps-environment` entitlement (iOS) to the Expo config.
- Re-run `expo prebuild` once native config lands so the new entitlements/permissions reach the iOS/Android projects.

### 2. Permission + token registration in the native app

In `push-settings.tsx` (or a new `lib/native-push.ts`):

- On toggle-on: call `Notifications.requestPermissionsAsync()`. If granted, fetch an Expo push token with `Notifications.getExpoPushTokenAsync({ projectId })` (project id from `expo-constants`).
- POST that token to a new backend route (see §3). On success, persist `enabled=true` and the token locally.
- On toggle-off: call the matching DELETE route to remove the subscription, then clear local state.
- Set a foreground handler with `Notifications.setNotificationHandler` so notifications surface while the app is open.
- Optional: register `Notifications.addNotificationResponseReceivedListener` to route taps (e.g. `appointmentId` → `/(tabs)/calendar?appointmentId=…`).

### 3. Backend: native-aware subscription model

Two reasonable shapes — pick one before building:

**Option A — Expo Push (recommended for speed).** Use the Expo push service (https://exp.host/--/api/v2/push/send) so iOS + Android share one delivery path.

- Migration: add nullable columns to `push_subscriptions` so the same table can hold native rows:
  - `platform text not null default 'web'` (`web` | `ios` | `android`)
  - `expo_token text` (nullable, unique when present)
  - Make `endpoint`, `p256dh`, `auth` nullable, since native rows won't have them.
- New routes:
  - `POST /api/push/native/subscribe` — body `{ token: string, platform: 'ios' | 'android' }`. Upsert by `(userId, expo_token)`.
  - `DELETE /api/push/native/subscribe` — remove rows for the calling user + token.
- Sender: extend `apps/app/lib/push.ts` to branch on `platform`. For native rows, POST batched messages to the Expo endpoint; for web rows, keep using `web-push`. Handle the Expo receipt poll (`DeviceNotRegistered` → delete the row).

**Option B — Direct FCM + APNS.** Skip Expo's push service and talk to FCM/APNS yourself.

- Same column additions, but `expo_token` becomes `device_token` and you also store the platform-specific topic/keys.
- Requires APNS key + FCM service account in env (`APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_AUTH_KEY`, `FCM_SERVICE_ACCOUNT_JSON`).
- Sender uses `apn` (or `node-apn`) for iOS and `firebase-admin` for Android.
- More work, but no dependency on Expo's free tier rate limits.

### 4. Api-client + payload shape

- Add `nativePush` to `packages/api-client` mirroring the two routes above so the native app calls them via the typed client instead of raw `fetch`.
- Decide on a shared payload schema (e.g. `{ title, body, data: { appointmentId?, clientId?, route? } }`). Both web-push and native senders should emit it identically so `addNotificationResponseReceivedListener` can route off `data.route`.

### 5. Triggers

Audit where the web pipeline currently fans out notifications (search for `sendWebPush` / `sendToUser` in `apps/app`). For each trigger (new appointment, status change, retention follow-up, etc.):

- Confirm it loads *all* of a user's subscriptions, not just web ones, after the schema change.
- Confirm copy reads correctly on a phone (push body is RTL Persian, max ~200 chars).

### 6. Testing + rollout

- Manual: physical iOS + Android device, sign in as staff, toggle on, trigger an appointment from the manager web, confirm receipt + tap-route.
- Add a development-only "send test" button on `push-settings.tsx` that hits a debug route to fire one push at the calling user.
- Monitor Expo receipts (Option A) or APNS/FCM logs (Option B) for `DeviceNotRegistered` and prune dead rows on a schedule.

## Out of scope (for now)

- Rich notifications (images, action buttons).
- Notification channels / categories beyond a single default channel.
- Per-event subscription preferences (e.g. mute retention notifications). The current toggle is all-or-nothing.

## Pointers

- Existing web pipeline: `apps/app/lib/push.ts`, `apps/app/app/api/push/*`
- DB schema for subscriptions: `packages/database/src/schema.ts:293`
- Native screen to extend: `apps/native/app/push-settings.tsx`
- Settings entry point that links to it: `apps/native/app/(tabs)/settings.tsx` (the "اعلان نوبت‌ها" card)
