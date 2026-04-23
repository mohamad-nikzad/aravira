# PWA Mobile Release Checklist

## Installability

- Validate `apps/app/public/manifest.json`.
- Confirm launcher name, short name, icons, screenshots, theme color, and background color look correct.
- Test Android Chrome install from a real device.
- Test iOS Safari "Add to Home Screen" flow from a real device.

## Runtime And Updates

- Verify the service worker is disabled in development and active in production.
- Confirm installed users receive the in-app update prompt after a fresh deploy.
- Accept the update and verify the app reloads into the latest bundle without stale chunk errors.
- Confirm old service worker caches are removed after activation.

## Offline And Weak Network

- Test calendar, today, clients, and client detail with airplane mode after a successful online load.
- Verify each screen shows cached data messaging instead of a silent failure.
- Verify first-time offline visits without cached data show a clear route-specific empty state.
- Confirm write actions remain disabled or clearly blocked when offline.

## Mobile UX

- Check bottom navigation safe-area spacing on a modern iPhone and Android device.
- Verify keyboard behavior on login, signup, appointment creation, and client forms.
- Confirm no core flow requires horizontal scrolling or pinch zoom.
- Check tap targets for floating actions, drawer controls, and nav items.

## Notifications

- Validate push opt-in, revoke, and re-subscribe flows on a supported device.
- Send a real push notification and confirm tap opens the intended in-app destination.
- Verify icon, badge, and copy quality in the notification tray.

## Smoke Matrix

- iPhone with notch on recent iOS
- Mid-range Android phone running Chrome
- One larger screen or tablet
