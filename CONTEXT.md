# Context

## Terms

- **Appointment Intake**: The salon workflow that turns a requested appointment create or update into either a validated appointment command or a precise scheduling rejection. It owns the effective time window, client/staff/Service references, staff capability, staff availability, and overlap rules before persistence.
- **Appointment Detail Read Model**: The tenant-scoped appointment view used by manager and staff screens when they need the appointment together with its client, staff, and Service details.
- **ServiceCategory**: A salon-scoped catalog grouping for a broad service area, such as `ناخن`, `مو`, `پوست`, `مژه`, `ابرو`, or `اسپا`. In the database and APIs this should use `service_categories`; in TypeScript it should use `ServiceCategory`.
- **ServiceFamily**: A salon-scoped catalog grouping inside a `ServiceCategory`, such as `کاشت ناخن`, `ترمیم ناخن`, `مانیکور`, or `رنگ مو`. In the database and APIs this should use `service_families`; in TypeScript it should use `ServiceFamily`.
- **ServiceVariant**: The sellable and bookable service selected by an appointment, such as `کاشت با پودر` or `کاشت دست و پا`. The existing `Service` type and `services` table represent this level; new catalog work should call the concept "service variant" in UI copy, helpers, and docs when distinguishing it from category or family.
- **BookedServiceSnapshot**: The appointment-owned copy of selected service details captured at booking time: booked service name, booked duration, and booked price. Dashboard revenue, appointment detail, and client history should use this snapshot where historical meaning matters.
- **Offline Projection**: The local data-client view produced by merging the last server snapshot with pending mutation rows so manager screens can show the salon state while writes are queued.
- **Tenant Request**: The authenticated salon request context used by API routes. It carries the tenant user and salon scope, or a ready authorization response when the caller is missing or lacks the requested permission.

## Service Catalog Naming

The catalog migration uses three levels: `ServiceCategory` > `ServiceFamily` > `Service`/`ServiceVariant`.

- Prefer `category`, `family`, and `service variant` in user-facing catalog language.
- Keep `services`, `serviceId`, `staff_services.service_id`, and `appointments.service_id` for the bookable variant level unless a later phase explicitly renames the API surface.
- Use `categoryId`, `categoryName`, `familyId`, and `familyName` on service read models so web, native, database, and data-client share the same field names.
- Use `bookedServiceName`, `bookedServiceDuration`, and `bookedServicePrice` for appointment snapshot fields.
- Avoid parallel names such as group, type, subtype, item, offering, option, or package for v1 catalog entities unless they refer to a different later feature.
