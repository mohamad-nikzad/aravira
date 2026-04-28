# PWA Runtime Notes

## Current Strategy

- Service worker versioning is explicit in `apps/app/public/sw.js` via `SW_VERSION`.
- The service worker only precaches install-critical assets such as icons, manifest, and launcher imagery.
- A tiny static offline launch page (`/offline-launch.html`) is also precached to guarantee a stable cold-start fallback.
- HTML navigations are `network-first`, then fall back to a same-version cached page when one exists.
- If the current route is not cached yet, the service worker falls back to any cached manager route (calendar/today/clients/etc.) before showing the offline launch page.
- Dynamic app code is no longer cached by the service worker. We rely on the browser and Next.js asset hashing instead of a broad SW cache-first policy.
- Media assets are served with a stale-while-revalidate style cache for faster repeat loads without risking stale JS bundles.

## Why This Is Safer

- A fresh deploy should not strand installed users on old JS chunks because the SW no longer persists app code aggressively.
- Navigation caches are versioned and cleared on activate, so cached HTML from an old runtime is removed when the new worker takes control.
- `updateViaCache: 'none'` is used during registration so the browser checks the latest service worker script directly.

## Update Flow

- The app checks for waiting workers on registration, on focus, on visibility return, and every 10 minutes while open.
- When a new worker is waiting, the UI shows an in-app toast with an explicit refresh action.
- Choosing update sends `SKIP_WAITING`; when control changes, the page reloads once.

## Offline Model In This Phase

- Read-heavy screens keep the latest successful payload in local storage for offline fallback:
  - Calendar
  - Today
  - Clients list
  - Client detail
- Auth state keeps the last successful session user so the installed app does not immediately bounce to login during offline launches.
- Offline behavior is intentionally read-only. Mutations should wait for a live connection.

## When To Bump The Service Worker Version

- Bump `SW_VERSION` whenever service worker behavior, offline shell content, or precached assets change.
- After bumping, test:
  - open app on an existing installed session
  - deploy/update
  - verify update toast appears
  - refresh into the new runtime
  - confirm old caches are removed
