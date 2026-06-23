---
id: BL-0040
title: Add audited Platform Owner Override
status: inbox
type: feature
priority: medium
size: medium
created: 2026-06-23
updated: 2026-06-23
---

## Parent

[BL-0031 Assisted Salon Setup and handoff](BL-0031-assisted-salon-setup-and-handoff.md)

## What to build

Allow a Platform Owner to deliberately enter an override mode for an active salon and use the same bounded operating-data editor available during setup. Every override mutation requires an explicit reason, live-data confirmation, and audit attribution. The override never creates a tenant session and never exposes or changes authentication or messaging secrets.

## Acceptance criteria

- [ ] Only an active `platform_owner` can enter Platform Owner Override for an active salon.
- [ ] Platform admins, support users, and viewers remain unable to use setup mutations after handoff.
- [ ] Override mode is visually explicit and requires a reason plus the existing live-data confirmation before mutation.
- [ ] Override can edit only the operating-data areas supported by Assisted Salon Setup.
- [ ] Override cannot read or change passwords, OTPs, sessions, credential accounts, messaging tokens, or other authentication secrets.
- [ ] No tenant session or salon-user impersonation is created during override.
- [ ] Every override mutation records the real Platform Owner, salon, action, reason, request metadata, and non-sensitive change summary in the admin audit log.
- [ ] API and UI tests cover allowed edits, every forbidden platform role, missing confirmation/reason, audit output, and secret boundaries.

## Blocked by

- [BL-0038 Hand a Setup Salon to a new owner](BL-0038-hand-off-setup-salon-to-new-owner.md)

