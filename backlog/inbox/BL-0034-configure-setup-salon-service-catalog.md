---
id: BL-0034
title: Configure the Setup Salon service catalog
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

Give authorized admins an end-to-end service-catalog workspace for a Setup Salon. They can apply a CatalogPreset and then create or edit the resulting categories, families, ServiceVariants, prices, durations, and add-ons using the same catalog invariants as salon managers.

## Acceptance criteria

- [ ] An authorized admin can apply an active CatalogPreset to a Setup Salon.
- [ ] An authorized admin can create and edit categories, families, ServiceVariants, and add-ons for a Setup Salon.
- [ ] Price, duration, hierarchy, archive, and duplicate rules match the existing manager catalog behavior.
- [ ] Applying a preset follows existing idempotency and duplicate-protection behavior.
- [ ] Setup catalog mutations are rejected for unauthorized roles and non-setup salons.
- [ ] The resulting catalog is immediately usable and editable in the manager app after handoff.
- [ ] API and UI tests cover preset application, manual editing, validation failures, permissions, and salon lifecycle enforcement.

## Blocked by

- [BL-0032 Create and recognize a Setup Salon](BL-0032-create-and-recognize-setup-salon.md)

