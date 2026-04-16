# Appointment & scheduling — plan (review)

## Issue summary

- The system should allow **multiple appointments in the same time window**, but only when each appointment is assigned to a **different staff member** and a **different customer**.
- The calendar is not “one customer per slot”; it is primarily constrained by **staff availability**, but **customer overlap must also be blocked**.
- We are **not** introducing grouped visits or multi-service parallel bookings for one client in this phase.
- The existing **staff visibility** principle remains correct: staff only see appointments assigned to them.

**Current gap:** scheduling is enforced mainly (or only) per staff. **Customer double-booking** is not consistently prevented. The product must explicitly allow concurrent appointments only when **staff differ and customers differ**, and block overlaps when **either** the same staff **or** the same customer is involved.

---

## Goals


| ID     | Goal                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------ |
| **G1** | Manager can create overlapping appointments in the same time period **only** when staff differ **and** customers differ. |
| **G2** | A staff member must **never** be double-booked.                                                                          |
| **G3** | A customer must **never** have overlapping appointments.                                                                 |
| **G4** | Staff only see and manage **their own** appointments.                                                                    |
| **G5** | Keep **backward compatibility** with the existing single-appointment model.                                              |


---

## Data model

- **Keep the current single-appointment model.**
- **One row = one appointment.**

Recommended conceptual fields (align with existing schema naming where applicable, e.g. `client_id` ↔ customer):


| Field         | Purpose                                                             |
| ------------- | ------------------------------------------------------------------- |
| `id`          | Primary key                                                         |
| `customer_id` | Client / customer                                                   |
| `staff_id`    | Assigned staff                                                      |
| `service_id`  | Service                                                             |
| `start_at`    | Interval start (or equivalent `date` + `start_time` until migrated) |
| `end_at`      | Interval end (or equivalent `date` + `end_time`)                    |
| `status`      | Lifecycle (scheduled, confirmed, completed, cancelled, no-show, …)  |
| `notes`       | Optional notes                                                      |
| `created_at`  | Audit                                                               |
| `updated_at`  | Audit                                                               |


No `visit_id`, no visits table, no appointment lines in this phase.

---

## Validation rules

- **Reject** appointment if the selected **staff** already has an **overlapping active** appointment.
- **Reject** appointment if the selected **customer** already has an **overlapping active** appointment.
- **Allow** appointment if overlapping wall-clock time exists **only** with appointments that use **different staff and different customers**.
- **Cancelled** appointments (and any other statuses defined as “inactive” for blocking) **must not** block time.
- On **update**, **exclude the current appointment** from conflict checks.

---

## Overlap logic

For a **new** or **updated** appointment, define overlap on the same calendar day (or on unified `start_at` / `end_at` if stored as timestamps).

**Staff conflict** exists if another **active** appointment has:

- same `staff_id`
- `existing.start_at < new.end_at`
- `existing.end_at > new.start_at`

**Customer conflict** exists if another **active** appointment has:

- same `customer_id`
- `existing.start_at < new.end_at`
- `existing.end_at > new.start_at`

**Concurrent booking is allowed** only when neither staff conflict nor customer conflict applies (i.e. different staff **and** different customers).

---

## Manager UI

- Keep the existing **create/edit flow for a single appointment**.
- Allow the manager to create appointments in a time slot even if another appointment already exists in that slot, **as long as**:
  - **staff is different**, and  
  - **customer is different**
- Show clear validation errors when:
  - selected **staff** is already booked (overlapping active appointment)
  - selected **customer** is already booked (overlapping active appointment)
- Calendar should support **overlapping events visually** across different staff (e.g. stacked or side-by-side per resource column).
- **Do not** add grouped-visit UI in this phase.

---

## Staff UI

- **No core workflow change.**
- Staff continue to see **only** appointments assigned to them.
- No visit/group context is needed in this phase.

---

## Migration

- No `visit_id` or grouped-booking migration.
- Existing appointments remain **unchanged** at the row level.
- Only **backend validation** and **calendar behavior** need adjustment if the UI currently assumes **one global appointment per time slot**.

---

## Phases


| Phase                       | Scope                                                                                                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0 — Rules alignment**    | Confirm business rules: same-staff overlap = not allowed; same-customer overlap = not allowed; different staff **and** different customers in the same time = allowed.                  |
| **P1 — Validation update**  | Add **customer overlap** validation alongside existing **staff** conflict validation. Standardize overlap checks using `start_at` / `end_at` (or consistent `date` + time composition). |
| **P2 — API update**         | Update create and edit appointment endpoints to enforce staff conflict and customer conflict. Return explicit conflict error codes/messages.                                            |
| **P3 — Manager UI**         | Ensure calendar and create/edit flow allow overlapping appointments in the same period when valid. Show precise error feedback for staff or customer conflict.                          |
| **P4 — Staff verification** | Verify staff still only see their own appointments. Verify no permission changes are needed.                                                                                            |
| **P5 — Testing / polish**   | Add tests for allowed overlaps and blocked overlaps. Review dashboard/report effects if any logic assumed one global appointment per slot.                                              |


---

## Risks & mitigations


| Risk                                                               | Mitigation                                                                                                                            |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Confusion about why some overlaps are allowed and some are blocked | Clear UI copy and validation messages: overlap allowed **only** for **different staff and different customers**.                      |
| Current calendar UI may assume one appointment per slot            | Update rendering to support **overlapping events** visually.                                                                          |
| Performance of conflict checks                                     | Add indexes on `(staff_id, start_at)` and `(customer_id, start_at)` (or equivalent for current `date` + time columns after analysis). |


---

## Open questions

- Which **statuses** should block time? (`scheduled` only, or also `confirmed` / `in_progress`?)
- Should **completed** appointments be ignored in overlap checks? (Usually **yes**.)
- Do we need **pre-check availability** in the manager form before submit, or only **backend validation** on save?
- Does any **reporting** logic assume one appointment per slot globally?

---

## Test cases

- Different customer + different staff + overlapping time ⇒ **allowed**
- Different customer + same staff + overlapping time ⇒ **blocked**
- Same customer + different staff + overlapping time ⇒ **blocked**
- Same customer + same staff + overlapping time ⇒ **blocked**
- Adjacent appointments where one ends exactly when the next starts ⇒ **allowed**
- Updating an appointment must **not** conflict with **itself**
- **Cancelled** appointments must **not** block new appointments

---

## Final architecture statement (this phase)

- Keep the appointment model **simple**: **one appointment = one customer + one service + one staff + one time range**.
- Support **concurrent** appointments only across **different staff** and **different customers**.
- Do **not** introduce grouped visits, `visit_id`, or multi-line booking yet.

