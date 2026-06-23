---
id: BL-0016
title: Staff can join multiple salons
status: inbox
type: feature
priority: medium
size: large
created: 2026-06-13
updated: 2026-06-23
---

## Problem

It is common for a staff member to work at multiple salons. The current model allows a verified staff identity to access only one salon's Staff Profile at a time, which forces staff to lose access to one workplace before joining another and does not reflect how they actually work.

Staff need one identity connected to multiple salon-owned Staff Profiles, plus a clear way to understand and change the salon context while managing their appointments.

## Smallest Useful Version

Before implementation, discuss and agree on the domain model and an UX-friendly way for staff to switch between salons and manage appointments in the correct salon context. Then define the smallest end-to-end version of multi-salon access.

## Acceptance Criteria

- [ ] One verified staff identity can be connected to Staff Profiles in multiple salons without losing access to another salon.
- [ ] Each salon continues to own its Staff Profile, schedule, capabilities, and operational history.
- [ ] Staff can clearly see their current salon context and switch salons through an agreed UX-friendly flow.
- [ ] Staff can view and manage appointments for the intended salon without leaking data across salon boundaries.
- [ ] Joining, leaving, removal, permissions, notifications, and scheduling conflicts across salons are discussed and documented before implementation.
- [ ] The effect on Staff Account Claim and Staff Access Transfer is defined.

## Notes

- Original note: "Add support for staffs be able to join multiple salons".
- Expanded note: Staff working at different salons is a common scenario. Salon switching and appointment handling need a product/domain discussion before this task is implemented.
