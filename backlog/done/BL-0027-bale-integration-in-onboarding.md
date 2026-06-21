---
id: BL-0027
title: Fix onboarding notifications step — env-gated providers and Bale beside Telegram
status: done
type: feature
priority: medium
size: small
created: 2026-06-21
updated: 2026-06-22
---

## Problem

The onboarding notifications step is out of sync with how messaging works everywhere else:

1. **Env gating (bug):** It always shows the Telegram connect card, even when Telegram is disabled on the server (`TELEGRAM_ENABLED=false` or missing bot config). Managers see a connect option that cannot work.
2. **Missing Bale:** Bale is already supported in manager settings, but new salons never see it during setup.

Settings already handles both correctly — it lists only configured providers from `GET /api/v1/messaging/accounts` and shows Telegram and Bale rows. Onboarding hard-codes Telegram only and ignores provider availability.

## Reproduction (env gating)

1. Run the API with `TELEGRAM_ENABLED=false` (or without required Telegram env vars).
2. Start or resume salon onboarding and open the notifications step.
3. Observe the Telegram connect card is still shown; connect fails or is a dead end.

## Smallest Useful Version

Refactor the onboarding notifications step to mirror settings: load `providers` from the messaging accounts API, render a matching connect card per configured provider (Telegram and Bale), and hide all connect UI when no providers are configured.

## Acceptance Criteria

- [x] Onboarding uses `providers` from `GET /api/v1/messaging/accounts`, not hard-coded Telegram-only UI.
- [x] Telegram connect UI is hidden when Telegram is not configured on the server.
- [x] Bale connect card appears beside Telegram when Bale is configured, with the same layout as Telegram (status row, connect button, linked state, error display).
- [x] Connecting during onboarding uses the same link flow as settings (`useMessagingConnect`).
- [x] When zero messaging providers are configured, the step does not offer broken connect actions; the manager can continue.
- [x] Onboarding `notificationsConfigured` is satisfied when any linked provider exists (existing behavior).
- [x] Copy is localized in Persian and consistent across providers.
- [x] Behavior matches manager settings messaging section for the same env configuration.

## Notes

- Reported on 2026-06-21. Merged from BL-0027 (Bale in onboarding) and BL-0028 (env gating).
- Env flags: `TELEGRAM_ENABLED`, `BALE_ENABLED` in `apps/api/src/env.ts`.
- Provider registry: `listConfiguredMessagingProviders()` in `packages/notifications/src/providers/registry.ts`.
- Onboarding today: `apps/pwa/src/routes/_authed/onboarding/notifications.tsx` (`TelegramConnectCard` only).
- Settings reference: `apps/pwa/src/components/settings/messaging-accounts-section.tsx`.
- Generic connect hook: `apps/pwa/src/components/messaging/use-messaging-connect.ts`.
- Likely refactor: extract a shared `MessagingConnectCard` from `TelegramConnectCard` with provider-specific labels/icons.
- Fixed on 2026-06-22 by making onboarding load configured providers from messaging accounts, adding Bale/Telegram shared provider labels, and covering configured, hidden, empty, and linked states with PWA tests.
