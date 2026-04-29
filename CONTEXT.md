# Context

## Terms

- **Appointment Intake**: The salon workflow that turns a requested appointment create or update into either a validated appointment command or a precise scheduling rejection. It owns the effective time window, client/staff/Service references, staff capability, staff availability, and overlap rules before persistence.
- **Appointment Detail Read Model**: The tenant-scoped appointment view used by manager and staff screens when they need the appointment together with its client, staff, and Service details.
- **Offline Projection**: The local data-client view produced by merging the last server snapshot with pending mutation rows so manager screens can show the salon state while writes are queued.
- **Tenant Request**: The authenticated salon request context used by API routes. It carries the tenant user and salon scope, or a ready authorization response when the caller is missing or lacks the requested permission.
