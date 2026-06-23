---
id: BL-0039
title: Harden Salon Handoff for existing identities and retries
status: inbox
type: feature
priority: high
size: medium
created: 2026-06-23
updated: 2026-06-23
---

## Parent

[BL-0031 Assisted Salon Setup and handoff](BL-0031-assisted-salon-setup-and-handoff.md)

## What to build

Extend Salon Handoff to safely reuse an existing eligible Saluna identity, reject phones already owning another salon, survive interrupted or repeated requests without duplicate records, and optionally publish the public page through an explicit admin choice that defaults off.

## Acceptance criteria

- [ ] A verified existing user without a salon can claim the Setup Salon without creating a duplicate user or replacing their password.
- [ ] A phone already owning another salon produces a clear admin conflict and cannot claim a second salon in this version.
- [ ] Setup Salon creation warns authorized admins when the intended-owner phone is already associated with a salon and shows that salon's name and status.
- [ ] Repeating handoff after a timeout or response loss returns the same successful ownership state without duplicate users, memberships, sidecars, or audit transitions.
- [ ] A consumed or superseded handoff link cannot transfer the salon to another identity.
- [ ] The handoff action offers an explicit enable-public-page choice that defaults to disabled.
- [ ] Enabling publication takes effect only after successful handoff and never publishes a Setup Salon.
- [ ] Domain, API, and UI tests cover existing identity reuse, ownership conflict, idempotency, stale links, and both publication choices.

## Blocked by

- [BL-0038 Hand a Setup Salon to a new owner](BL-0038-hand-off-setup-salon-to-new-owner.md)

