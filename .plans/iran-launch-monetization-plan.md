# Aravira Iran Launch Monetization Plan

## Context

Aravira already looks like a real salon operations product, not just a concept or landing page.

The product currently includes:

- Salon signup and workspace creation.
- Appointment calendar and daily operations flows.
- Client records and notes.
- Staff management and role-based access.
- Services, pricing, and business-hour settings.
- Dashboard reporting and revenue visibility.
- Retention queue foundations.
- PWA and offline-friendly behavior.
- Staff push notification groundwork.

This means the monetization question is no longer "can we charge for basic scheduling?"

The better question is:

> Which outcomes can Aravira create for salon owners in Iran that are important enough to pay for, operationally possible to deliver, and resilient to local payment and sanctions constraints?

This plan focuses on answering that question and turning it into a practical launch path.

## Product Reality Check

### What Aravira Already Has

Aravira already solves meaningful operational problems for salon managers:

- Organizing appointments across staff and time slots.
- Keeping client information in one place.
- Tracking completed, cancelled, and no-show appointments.
- Showing dashboard metrics like monthly revenue and service popularity.
- Supporting manager and staff workflows separately.
- Supporting mobile-first daily use through a PWA approach.

These are valuable foundations and are enough to support paid B2B plans.

### What Aravira Does Not Yet Fully Monetize

The current product still has a gap between "useful salon software" and "easy-to-sell business subscription."

The biggest missing pieces are:

- Automated client messaging.
- Customer-facing online booking.
- Deposit or prepayment flows.
- Strong premium reporting exports and backups.
- Premium multi-branch workflows exposed in the UI.
- A polished billing and subscription system.

That is important because salon owners usually pay more easily for:

- Fewer no-shows.
- More repeat visits.
- Less manual follow-up.
- Easier booking from Instagram and WhatsApp.
- Better visibility into money and staff performance.

## Monetization Strategy

## Core Decision

Aravira should launch first as a B2B salon operating system with premium automation features.

It should not launch first as:

- A consumer marketplace.
- An ad-supported product.
- A generic booking tool for every industry.
- A payment-first platform.

The first paid story should be simple:

> Aravira helps salon owners run appointments, reduce no-shows, bring clients back, and save front-desk time.

That value proposition fits the current product much better than broader marketplace ambitions.

## Monetization Model

Use a three-part model:

1. Free entry plan.
2. Paid subscription plans.
3. One-time onboarding and setup services.

### Free Entry Plan

The free plan should help salons adopt the product without friction.

Recommended free-plan boundary:

- 1 manager account.
- 1 staff account or a small staff cap.
- Limited number of active clients.
- Limited number of monthly appointments.
- Core calendar and client management only.
- No automated reminders.
- No retention automation.
- No premium reporting or exports.

Goal:

- Make the free plan useful enough to create habit.
- Make the paid upgrade feel like a business unlock, not a forced tax.

### Paid Subscription Plans

Paid plans should be based on business outcomes, not abstract feature counts.

Primary upgrade triggers:

- Need reminders.
- Need win-back automation.
- Need shareable booking link.
- Need more staff.
- Need advanced reporting.
- Need exports, backups, or premium support.

### Setup And Onboarding Services

For Iran, service revenue is strategically important in the early stage.

Offer optional one-time setup packages for:

- Creating the salon workspace.
- Importing or entering service list.
- Entering staff and schedules.
- Initial client migration.
- Install and training on phones.
- First-week support.

This helps in three ways:

- It creates immediate cash flow.
- It reduces churn from weak onboarding.
- It makes the product easier to sell to less technical salon owners.

## Value Creation Roadmap

## Phase 1: Monetize What Already Exists

Goal: start charging without waiting for a huge product expansion.

Paid from the current or near-current product surface:

- Manager dashboard and advanced reporting.
- Full staff management.
- Larger appointment and client limits.
- Offline-first reliability as a premium operational benefit.
- Priority support and training.

Why this works:

- Some salons will pay for organization and reporting alone.
- This creates early revenue while bigger monetization features are still being built.

Limitations:

- This will likely support low-to-mid pricing, not premium pricing.
- It is more vulnerable to comparison with cheap local tools.

## Phase 2: Build The Strongest Paid Features

Goal: add features tied directly to money-saving or revenue-generating outcomes.

Highest-priority monetization features:

### 1. Automated Appointment Reminders

Channels:

- SMS first.
- Push notification where supported.
- Optional WhatsApp-style manual share flows if direct automation is difficult.

Why it matters:

- It reduces no-shows.
- It saves reception time.
- Salon owners understand its value immediately.

This should become one of the main Pro-plan features.

### 2. Retention Automation

Aravira already has a retention queue foundation.

The next step is to turn it into action:

- Send reminder campaigns to inactive clients.
- Follow up after no-shows.
- Encourage a second booking for first-time clients.
- Tag VIP clients and trigger special treatment flows.

Why it matters:

- It turns your current data into repeat revenue for salons.
- It is easier to justify than generic CRM language.

### 3. Public Booking Link

Give each salon a customer-facing booking page or booking link.

Ideal use cases:

- Instagram bio link.
- WhatsApp direct message reply.
- Google Business profile link.
- Staff-specific booking links.

Why it matters:

- It removes manual back-and-forth.
- It increases convenience for clients.
- It creates a visible premium difference between free and paid plans.

### 4. Deposit Or Prepayment Flow

Allow salons to require:

- Full payment.
- Partial deposit.
- Manual payment-link preconfirmation.

Best first use:

- Optional for expensive services.
- Optional for high-no-show salons.

Why it matters:

- It directly lowers no-show risk.
- It gives salons a financial reason to upgrade.

### 5. Exports, Backups, And Business Controls

Offer premium controls like:

- CSV exports.
- Backup and restore paths.
- Printable or shareable reports.
- Audit-friendly revenue summaries.

Why it matters:

- This builds trust.
- It matters more as salons become dependent on the system.

## Phase 3: Premium And High-Ticket Expansion

Goal: support larger salons and chains with premium contracts.

Potential premium capabilities:

- Multi-branch management.
- Shared or centralized reporting.
- Resource-based scheduling.
- Brand customization.
- Dedicated onboarding and support.
- Data migration and white-glove setup.
- Custom report requests.

This should be a higher-ticket plan or custom contract, not part of the core launch package.

## Iran Launch Constraints

## Product And Infrastructure Assumptions

Assume the Iran launch environment includes:

- International sanctions and service restrictions.
- Payment gateway limitations compared with Stripe or Apple/Google billing.
- Greater dependence on local payment providers.
- Uneven device quality and network reliability.
- Heavy mobile usage.
- Strong reliance on Instagram, WhatsApp, and direct messaging for customer acquisition.

Because of this, Aravira should stay:

- Web-first.
- PWA-first.
- Mobile-first.
- Operationally portable across infrastructure providers.

## Payments

Do not design the first monetization system around:

- Stripe.
- PayPal.
- App Store billing.
- Google Play billing.

Prefer local payment gateway integration and payment-link flows.

Recommended first payment approach:

- Manually managed subscriptions in the admin workflow.
- Local payment link generation through an Iranian gateway.
- Quarterly and semiannual plans instead of monthly auto-renew dependence.
- Human fallback for failed renewals.

Why:

- It is more resilient in the local market.
- It reduces operational dependence on unsupported global billing rails.

## Messaging

For reminder and retention features, prioritize:

- Iranian SMS providers.
- Push notifications as a secondary path.

Messaging strategy:

- SMS for the highest-value reminders.
- Push for staff workflows and app users.
- In-app call and reschedule actions where helpful.

Why:

- SMS is widely understood by salons and clients.
- Push alone will not cover all customer communication needs.

## Distribution

The PWA approach is a strategic advantage for Iran.

Benefits:

- Less app-store dependency.
- Easier onboarding from a simple URL.
- Better compatibility with the way small businesses actually adopt software.
- Faster operational updates without store-review delays.

Requirements:

- Installation guidance must be simple.
- Mobile performance must stay strong.
- Offline and flaky-network handling must feel trustworthy.

## Pricing Strategy

Use toman-based pricing and emphasize prepaid discounts.

Recommended starting structure for market testing:

### Free

- Very small team.
- Limited appointment/client volume.
- Core scheduling only.

### Standard

Target range:

- 300,000 to 600,000 toman per month equivalent.

Best for:

- Small single-location salons that need operational structure.

Features:

- Full calendar.
- Client management.
- Staff management.
- Services and settings.
- Basic dashboard.

### Pro

Target range:

- 800,000 to 1,500,000 toman per month equivalent.

Best for:

- Salons that rely on daily booking volume and need automation.

Features:

- Automated reminders.
- Retention automation.
- Booking link.
- Advanced reporting.
- Exports and backups.
- Higher staff and client limits.

### Premium / Chain

Pricing:

- Custom monthly or quarterly contract.
- Optional setup fee.

Best for:

- Multi-branch salons.
- Premium salons.
- Operators who want branding, migration, or dedicated support.

Features:

- Multi-branch workflows.
- Central reporting.
- Dedicated support.
- White-glove onboarding.
- Optional custom development.

## Go-To-Market Plan

## First Market Segment

Start with:

- Single-location beauty salons.
- 2 to 8 staff.
- Managers who already coordinate appointments manually via phone, Instagram, or WhatsApp.

Why this segment:

- The pain is clear.
- The product already fits their workflow.
- Sales cycles are shorter.
- Setup complexity is manageable.

Avoid starting with:

- Generic medical booking.
- Large chains only.
- Marketplace-style discovery.
- Full POS and accounting expectations.

## Sales Motion

Use a hybrid motion:

- Self-serve signup for interest capture.
- Human-assisted onboarding for conversion.

Practical path:

1. Salon signs up free.
2. You contact or guide them through setup.
3. They use core features for a short activation period.
4. You upsell reminders, booking link, and reporting once the calendar becomes part of daily operations.

This matches the reality that many early customers will still want help and reassurance.

## Upgrade Triggers

Build your upgrade prompts around moments of felt pain:

- "You reached your monthly appointment limit."
- "You have repeat no-shows. Enable reminders."
- "You have inactive clients ready for follow-up."
- "Your salon needs a booking link for Instagram."
- "You added more staff. Upgrade for team workflows."

These are better than generic "go Pro" prompts.

## 60-Day Execution Plan

## Days 1-15

Goal: formalize the business model and launch boundary.

Tasks:

- Finalize free vs paid boundaries.
- Choose initial pricing ranges in toman.
- Define manual billing workflow.
- Define onboarding service package.
- Define first target customer segment.

Acceptance criteria:

- Pricing and packaging are documented.
- The first sales story is simple and consistent.

## Days 16-35

Goal: build the first true monetization feature.

Priority:

- Automated appointment reminders.

Tasks:

- Choose SMS provider.
- Implement reminder scheduling rules.
- Add reminder status visibility for salons.
- Add plan gating for reminder usage.

Acceptance criteria:

- A salon can enable reminders.
- A reminder can be triggered for a real appointment.
- Reminder usage can be tied to plan rules.

## Days 36-50

Goal: turn retention into a paid growth feature.

Tasks:

- Add sendable retention campaigns from the current retention queue.
- Support inactive and no-show client follow-ups first.
- Add templates and message logging.

Acceptance criteria:

- A manager can trigger retention outreach from the app.
- The feature is packaged clearly as a premium value driver.

## Days 51-60

Goal: improve conversion from usage to paid plan.

Tasks:

- Add upgrade prompts tied to pain points.
- Add clear plan comparison inside the product.
- Add setup-service offer during onboarding.
- Prepare simple sales and demo materials for salons.

Acceptance criteria:

- The product has clear paths from free usage to paid upgrade.
- A human operator can sell and onboard the product consistently.

## Success Metrics

Track monetization with simple operating metrics first.

Key metrics:

- Number of active salons.
- Percentage of salons that complete onboarding.
- Percentage of salons active after 30 days.
- Free-to-paid conversion rate.
- Percentage of paid salons using reminders.
- Appointment no-show rate before and after reminders.
- Percentage of retention items acted on.
- Average revenue per salon.
- Setup-service attachment rate.
- Churn rate by plan.

Do not overcomplicate this with a large analytics framework at the beginning.

The main goal is to learn:

- Which value proposition closes sales.
- Which feature keeps salons paying.
- Which customer segment has the strongest retention.

## Risks

## Risk 1: Charging Too Early For Basic Scheduling

If the free plan is too weak, salons may never adopt the product deeply enough to feel upgrade pressure.

Mitigation:

- Keep the free plan operationally useful.
- Reserve automations and premium business controls for paid tiers.

## Risk 2: Building Too Many Features Before Monetization

If too much time is spent on broad platform work, monetization gets delayed and learning slows down.

Mitigation:

- Build the smallest paid feature with the clearest ROI first.
- Prioritize reminders and retention over broader expansion.

## Risk 3: Overdependence On Fragile International Infrastructure

Sanctions or provider restrictions can create sudden business risk.

Mitigation:

- Favor portable hosting and infrastructure choices.
- Prefer local payment and messaging integrations where possible.
- Avoid core revenue dependence on unsupported foreign billing systems.

## Risk 4: Pricing Too High For Current Value

Without automated messaging and public booking, premium pricing may feel unjustified.

Mitigation:

- Start with moderate pricing.
- Increase pricing only after outcome-driven features ship.

## Recommendation

Aravira should launch monetization in this order:

1. Sell the current app as a lightweight salon operating system with free entry and paid operational tiers.
2. Add automated reminders as the first major paid feature.
3. Turn retention into a real automation workflow.
4. Add a booking link and optional deposit flow.
5. Expand into premium multi-branch and branded offerings.

The main principle is:

> Charge salons for fewer no-shows, better repeat visits, and less manual work.

That is the clearest path to product value, local market fit, and practical monetization in Iran.
