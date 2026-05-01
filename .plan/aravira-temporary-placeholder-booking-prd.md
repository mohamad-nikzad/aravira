# Aravira PRD: Temporary Placeholder Booking For Incomplete Client Details

## Problem Statement

Salon managers sometimes need to create an appointment for a real person before they have that person’s full details. A common case is when someone calls on behalf of a friend and requests a service and time slot without sharing the friend’s name or phone number clearly enough to create a normal client record.

Today, Aravira’s Appointment Intake requires a real client record and the current client creation flow requires both name and phone. This pushes managers to leave Aravira and use notes, memory, or another tool to remember the missing information. That breaks the product promise that the manager can run the day from one app and weakens the Appointment Detail Read Model, retention workflows, and client memory over time.

The product needs a lightweight manager-only way to capture the appointment now, clearly mark the linked client data as incomplete, and guide the manager to complete it later without turning incomplete clients into a first-class normal client mode.

## Solution

Aravira will support a manager-only temporary placeholder booking flow inside appointment create and edit surfaces.

When a manager does not yet have full client details, they can switch the client section into a temporary booking mode labeled with explanatory language such as `بعداً اطلاعات مشتری را کامل می‌کنم`. In that mode, the manager can enter a required display name and an optional note, then continue booking the service, staff member, and time normally. The system creates a special placeholder client record that is valid for Appointment Intake but is clearly marked as incomplete.

Placeholder clients are intentionally constrained:

- They are created only from appointment flows, not from the main clients screen.
- They represent one appointment only as a product rule.
- They are visually separated from normal clients and do not behave like complete customer records.
- They expose manager-only completion cues and no phone-based actions.
- When the manager later completes the details, the booking becomes a normal client-backed appointment with no remaining visual trace of its temporary origin.
- If the placeholder appointment is cancelled or deleted before completion and the placeholder has no other valid usage, the placeholder is auto-removed.

This keeps the current scheduling model intact while giving managers a safe in-app escape hatch for a rare but real workflow.

## User Stories

1. As a salon manager, I want to create an appointment even when a caller is booking for a friend, so that I do not need to leave Aravira and use a notes app.
2. As a salon manager, I want the incomplete-details flow to live inside the existing appointment drawer, so that it feels like a small exception instead of a separate workflow.
3. As a salon manager, I want to switch into temporary booking mode with a simple checkbox, so that the rare path stays easy to find without becoming the default booking mode.
4. As a salon manager, I want the temporary booking checkbox to use plain explanatory language, so that I immediately understand what will happen.
5. As a salon manager, I want the normal client picker to be replaced by a dedicated temporary booking block when I opt in, so that the form does not show two competing client modes at once.
6. As a salon manager, I want the temporary booking block to autofocus the name field, so that the rare workflow remains fast on mobile.
7. As a salon manager, I want to create a temporary booking with only a display name, so that I can capture the booking even when I do not know the phone number yet.
8. As a salon manager, I want to add an optional note to a temporary booking, so that I can record hints like `دوستِ سارا` or `اسم را بعداً می‌گیرم`.
9. As a salon manager, I want to continue selecting service, staff, date, time, and appointment notes normally while using temporary booking mode, so that the rest of the appointment flow stays familiar.
10. As a salon manager, I want temporary mode to clear its temporary input if I turn it off, so that I do not accidentally submit stale placeholder text.
11. As a salon manager, I want a temporary booking to create a valid appointment immediately, so that the schedule reflects reality even before client details are complete.
12. As a salon manager, I want incomplete temporary bookings to be visually marked in manager views, so that I remember to follow up before the visit.
13. As a salon manager, I want the calendar view to show a subtle temporary marker, so that I can notice incomplete bookings without making the calendar noisy.
14. As a salon manager, I want Today cards and appointment detail views to show a clear incomplete badge, so that I can spot incomplete client data when operational action matters.
15. As a salon manager, I want the appointment detail view to offer a `تکمیل اطلاعات مشتری` action near the incomplete badge, so that the reason and the recovery action are obvious together.
16. As a salon manager, I want the completion flow to open a focused completion sheet instead of a general client management form first, so that I can finish the missing details quickly in context.
17. As a salon manager, I want the completion sheet to ask for name, phone, and optional note, so that I can promote the placeholder into a normal client record with minimal effort.
18. As a salon manager, I want duplicate-phone handling during completion, so that I do not create split histories for the same real client.
19. As a salon manager, I want the system to detect when the entered phone already belongs to an existing client, so that I can reassign the appointment correctly.
20. As a salon manager, I want the completion flow to offer reassignment to the existing client when the phone already exists, so that Aravira preserves one trustworthy client identity per phone number.
21. As a salon manager, I want the old placeholder to be retired after reassignment, so that incomplete placeholder records do not pollute the system.
22. As a salon manager, I want a completed placeholder booking to look exactly like a normal appointment afterward, so that the system does not keep surfacing resolved exceptions.
23. As a salon manager, I want incomplete temporary bookings to appear in the Today attention area when they are today or soon, so that I get timely nudges without a new management screen.
24. As a salon manager, I want temporary placeholder bookings to remain out of the primary clients roster by default, so that the main client list stays focused on real customers.
25. As a salon manager, I want placeholder clients to avoid phone-based actions until completion, so that I never see broken call buttons or misleading phone UI.
26. As a salon manager, I want cancelled or deleted incomplete temporary bookings to clean themselves up automatically when safe, so that one-off placeholders do not accumulate.
27. As a salon manager, I want the temporary booking flow to work with Offline Projection and queued manager writes, so that the same rare workflow still works during connectivity issues.
28. As a salon manager, I want clear validation errors if a temporary booking cannot be completed because the phone belongs to another client, so that I can choose reassignment confidently.
29. As a staff member, I want my appointment workflow to remain unchanged, so that I do not inherit manager-only data cleanup responsibilities.
30. As a staff member, I want to continue seeing my appointments normally even if one was created temporarily, so that the schedule still reflects the real day.
31. As a product owner, I want this feature to reuse the current single-appointment model, so that the solution stays small and does not require a new booking draft subsystem.
32. As a product owner, I want incomplete placeholder handling to remain manager-only, so that roles stay crisp and staff status workflows remain simple.
33. As a product owner, I want temporary booking to be clearly framed as an exception path, so that it solves the real problem without encouraging low-quality client data as the norm.
34. As a product owner, I want the implementation to preserve tenant-scoped scheduling and client uniqueness rules, so that the feature does not weaken data integrity.
35. As a product owner, I want placeholder cleanup and completion behavior to be deterministic, so that reporting, retention, and client memory remain trustworthy.

## Implementation Decisions

- The feature will be modeled as a special kind of client record, not as appointment-only temporary fields. This preserves the existing Appointment Intake contract that every appointment references a client.
- The current single-appointment model remains unchanged. One appointment still links to one client, one staff member, one service, and one time window.
- Placeholder clients will be manager-created only from appointment create and appointment edit flows. The normal client creation surfaces will not expose placeholder mode.
- The client entity will support an incomplete placeholder state. The minimal schema change is to make phone nullable for client records and add an explicit placeholder flag so the system can distinguish incomplete temporary records from normal clients.
- Placeholder clients will use the existing notes field for optional context instead of introducing a dedicated notes structure for this feature.
- Placeholder clients are a product-level one-appointment-only concept. The UI and service layer will prevent managers from using placeholder creation as a reusable client shortcut.
- Appointment Intake will continue validating client references, staff capability, staff availability, and overlap rules exactly as today. Placeholder clients are valid client references once created.
- A dedicated placeholder client lifecycle module should be introduced as a deep module. Its responsibilities should include creating placeholder clients, completing placeholder clients, resolving duplicate-phone completion, reassigning appointments to an existing client when needed, and removing orphaned placeholders safely.
- The completion flow should use a focused completion sheet rather than dropping directly into general client editing. That sheet should support both normal completion and duplicate-phone reassignment.
- Duplicate-phone completion should preserve the salon-level unique phone rule. If the entered phone already exists, the system should offer reassignment of the appointment to that existing client instead of allowing two normal clients with the same phone.
- After successful completion, the placeholder flag should be removed and the linked appointment should become indistinguishable from a normal appointment.
- If a placeholder-backed appointment is cancelled or deleted before completion, the system should auto-remove the placeholder when it is safe to do so and no longer needed.
- Manager-facing presentation rules should be centralized in a small client presentation policy layer so all manager surfaces render placeholder badges, missing-phone behavior, and completion CTAs consistently.
- The appointment drawer client section should become a two-state mode: standard client selection or temporary booking block. The rest of the appointment form stays visible and unchanged in both modes.
- The temporary booking block should require only a display name and optionally accept a note. The input should autofocus when the mode is enabled.
- The temporary mode should be labeled with explanatory copy. Short labels such as `موقت` are appropriate only for tight visual surfaces like compact calendar markers.
- Manager views should show incomplete state with different intensity by surface: subtle in dense calendar tiles, explicit in Today and appointment detail, and actionable in the appointment detail CTA.
- Staff workflows should not receive completion warnings, placeholder cleanup actions, or new responsibilities. Staff may still see the appointment name because it is part of their schedule, but the incomplete-management affordances remain manager-only.
- The Today attention logic should gain a manager-only rule for incomplete placeholder bookings that are scheduled for today or soon. This should augment, not replace, the existing attention model.
- Search, call actions, retention displays, and client list behavior must all tolerate clients without phone numbers. No fake phone numbers should be introduced because that would pollute normalization, deduplication, search, and call affordances.
- The data-client and sync layer must support placeholder creation and completion as first-class offline-safe mutations so Offline Projection remains coherent.

## Testing Decisions

- Good tests should verify external behavior and user-visible outcomes rather than implementation details. They should assert scheduling validity, completion outcomes, cleanup behavior, and role-specific UI behavior instead of internal state transitions.
- The placeholder client lifecycle module should have isolated tests because it is the deepest new behavior boundary and carries the highest integrity risk.
- Appointment Intake and appointment update behavior should be tested to confirm placeholder-backed appointments still obey all existing overlap, staff eligibility, and availability rules.
- Completion tests should cover successful conversion to a normal client, duplicate-phone reassignment to an existing client, and post-completion removal of placeholder indicators.
- Cleanup tests should cover cancelled or deleted incomplete placeholder appointments and verify safe orphan removal behavior.
- Manager UI tests should cover the client section mode switch, temporary booking submission, incomplete badges, Today attention appearance, and the focused completion sheet.
- Staff UI tests should verify that staff do not receive manager-only placeholder cleanup controls while still seeing the appointment normally.
- Offline-aware tests should verify that placeholder creation and completion behave correctly through queued writes and hydration, especially because the current data-client already mirrors client creation and update flows.
- Prior art for domain tests exists in the current isolated scheduling and availability tests for appointment conflict, appointment time, staff availability, and related database validation behavior.
- Prior art for API and integration tests exists in the current tenant isolation coverage and the existing client and appointment route behavior.
- Prior art for UI and flow validation exists in the current manager mobile booking and appointment workflows, including the existing calendar, appointment drawer, and Today interactions.

## Out of Scope

- Public self-serve booking or customer-facing booking flows.
- Staff-facing completion workflows or staff ownership of missing client details.
- Automated messaging, reminders, SMS, WhatsApp, or outbound follow-up providers.
- Multi-appointment placeholder clients that intentionally represent several future bookings.
- A general draft appointment subsystem.
- Broader client-profile enrichment beyond what is needed to complete a placeholder into a normal client.
- Historical display that an appointment was once temporary after the placeholder has been completed successfully.
- Reworking the main clients page into a placeholder management console.

## Further Notes

- This feature is reasonable because it solves a real operational gap without changing Aravira’s core product direction. It should remain intentionally small, manager-first, and exception-oriented.
- The biggest hidden implementation cost is not Appointment Intake itself. It is the number of places that currently assume every client has a phone number. The implementation should treat missing-phone tolerance as a deliberate cross-cutting requirement.
- The safest rollout path is to ship in two slices if needed:
  - slice 1: placeholder creation in appointment flows, manager badges, completion sheet, and missing-phone-safe rendering
  - slice 2: Today attention rule, orphan cleanup polish, and expanded offline coverage
- The product principle for this feature should stay consistent: help the manager keep working now, then guide them back to clean client data before the exception becomes permanent.
