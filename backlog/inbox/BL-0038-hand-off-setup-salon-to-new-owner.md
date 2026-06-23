---
id: BL-0038
title: Hand a Setup Salon to a new owner
status: inbox
type: feature
priority: high
size: large
created: 2026-06-23
updated: 2026-06-23
---

## Parent

[BL-0031 Assisted Salon Setup and handoff](BL-0031-assisted-salon-setup-and-handoff.md)

## What to build

Complete the basic Salon Handoff path for a new owner. An authorized admin can correct the intended-owner phone and generate a one-time link. The recipient must verify that phone through OTP and set their own password; Saluna then attaches the owner identity, activates the salon, ends ordinary setup editing, and opens the normal manager app.

## Acceptance criteria

- [ ] An authorized admin can edit the intended-owner phone while the salon remains in setup.
- [ ] An authorized admin can generate and copy a one-time handoff link for the recorded phone.
- [ ] The handoff link does not expose reusable credentials or permit claiming with a different phone.
- [ ] The recipient must successfully verify the recorded phone through the existing OTP behavior.
- [ ] A new owner establishes their own password after OTP verification; platform staff never sees or supplies it.
- [ ] Successful handoff atomically creates the owner membership and salon member record, activates the salon, and marks onboarding so the owner enters the normal manager experience.
- [ ] Ordinary assisted-setup mutations are rejected immediately after activation.
- [ ] The public salon page remains disabled by default.
- [ ] Auth, API, and browser-level tests cover link generation, OTP failure, password validation, successful activation, redirect, and post-handoff access boundaries.

## Blocked by

- [BL-0032 Create and recognize a Setup Salon](BL-0032-create-and-recognize-setup-salon.md)

