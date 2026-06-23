# Platform Owner Override without impersonation

Ordinary platform setup access ends at Salon Handoff, but a Platform Owner may override that boundary to edit an active salon when an operational need exists. Every override requires an explicit reason, live-data confirmation, and audit event; it never exposes authentication secrets, takes over a session, or acts under another user's identity. We rejected permanently invisible tenant access because an operational escape hatch does not justify acting as salon users.
