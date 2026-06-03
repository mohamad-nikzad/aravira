# Designer Brief: Product, Brand, and Feature Context

## Purpose of this document

This document is meant to help a designer recreate the full visual identity, color system, UI mood, and overall product language for the app.

It summarizes:

- what the app does
- who it is for
- what the product is trying to achieve
- what features are already supported
- what features are likely to be added next
- what the design system should be ready for

## Brand note

The final product name is `Saluna`.

The designer should treat `Saluna` as the official brand for:

- logo exploration
- color system
- typography direction
- iconography
- marketing identity
- in-app product identity

## What the app is

This is a mobile-first salon operations app for beauty salons.

It helps salon owners and staff manage daily work in one place:

- appointments
- staff schedules
- services
- clients
- daily workflow
- salon performance

The app is primarily designed for Persian-speaking users, with a right-to-left interface, Jalali dates, and a mobile usage pattern.

## Who the app is for

Primary users:

- salon managers / owners
- salon staff

Manager needs:

- see the full salon schedule
- create and edit appointments
- manage clients
- manage staff, services, and working hours
- review business performance
- follow up with clients who may need attention

Staff needs:

- see only their own relevant schedule
- review their day quickly
- receive appointment notifications

## Product intentions

The product is trying to feel:

- calm during a busy salon day
- practical and fast on mobile
- trustworthy for operational work
- elegant enough for beauty-industry users
- simple for non-technical users

Core product intentions:

- reduce booking chaos and scheduling mistakes
- give the manager one clear place to run the salon
- help staff stay focused on their own work
- turn client history into useful daily context
- make the app usable as an installed web app on phones

## What the app supports today

### 1. Authentication and salon setup

- manager signup for creating a new salon workspace
- login for manager and staff accounts
- onboarding flow for first-time setup
- salon profile basics
- working hours setup
- first service setup
- first staff setup
- first appointment setup

### 2. Today view

- dedicated "Today" screen
- quick view of the active queue for the day
- manager view and staff view are different
- staff can focus on their own day
- quick jump from today view into calendar

### 3. Appointment calendar

- day view
- week view
- month view
- list view
- staff filtering
- appointment detail drawer
- create new appointment from the calendar
- create appointment from a floating action button
- create appointment for a selected client
- edit appointment
- delete appointment
- update appointment status

Supported appointment statuses:

- scheduled
- confirmed
- completed
- cancelled
- no-show

### 4. Appointment intelligence

- conflict checking for scheduling
- staff availability validation
- suggested time-slot availability search
- nearest available slot lookup
- service duration-aware booking logic
- staff-to-service matching

### 5. Client management

- client list
- search by name or phone
- create client
- edit client
- client profile page
- direct tap-to-call from client profile
- notes per client
- tags
- visit history
- upcoming appointment summary
- simple client value / behavior stats

### 6. Temporary / incomplete client handling

- appointments can be created with a temporary placeholder client
- missing client details can be completed later

This is useful for salons that need to reserve a slot quickly before full client data is available.

### 7. Service management

- create services
- edit services
- activate / deactivate services
- category-based services
- duration per service
- price per service
- color per service

Current service categories in the product:

- hair
- nails
- skincare
- spa

### 8. Staff management

- manager and staff roles
- add staff members
- role-based access
- assign which services a staff member can perform
- define staff working schedule
- staff color coding

### 9. Dashboard and salon insights

- total clients
- active staff count
- appointments for today, week, and month
- monthly revenue
- new clients this month
- appointment status breakdown
- popular services
- staff workload distribution

### 10. Retention / client follow-up workflow

- retention queue
- client follow-up reasons such as inactive, no-show, new client, VIP, or manual
- mark follow-up items as reviewed or dismissed
- jump from follow-up queue to client profile or booking flow

Important note:

- this is currently an internal review queue, not an automatic outbound messaging system

### 11. PWA and mobile behavior

- installable web app
- home-screen launch behavior
- update prompt when a new version is available
- offline fallback for key read screens after they were loaded once
- mobile-safe layout patterns

Current offline behavior is limited:

- read-heavy screens can show cached data
- offline use is intentionally limited
- write actions are not positioned as fully offline-safe in the current product phase

### 12. Notifications

- staff push notification opt-in exists
- web push infrastructure exists
- notification click can route back into the app

## What is not the product yet

The current product is not yet a complex consumer booking marketplace or a large enterprise platform.

It does not currently appear to be focused on:

- public customer self-booking flows
- marketing automation
- grouped visits
- multi-service parallel booking for one client in one session
- deeply expanded multi-branch enterprise UI

## Features likely to be added next

These are based on roadmap docs and technical groundwork in the codebase. They should be treated as likely direction, not final promises.

### 1. Better overlap booking rules

Planned scheduling behavior indicates:

- overlapping appointments should be allowed when staff are different and clients are different
- the same staff member should never be double-booked
- the same client should never be double-booked

This means the calendar UX may become more sophisticated in how overlapping bookings are shown.

### 2. Stronger offline-first sync

There is clear groundwork for:

- queued offline mutations
- local sync review
- conflict handling for offline-created records

This suggests the product may evolve from "offline read support" toward more serious offline-first operation.

### 3. Public-facing salon identity or profile

The onboarding flow references future use of salon identity and public link presentation.

That suggests a future need for:

- stronger brand expression
- salon profile presence
- public-facing identity surfaces

### 4. Multi-location and resource support

The data model already includes groundwork for:

- locations
- resources

But there is no visible product layer for this yet. Design should remain extensible enough for:

- multiple branches
- rooms
- chairs
- equipment-based booking constraints

### 5. More advanced notification and reminder flows

Push foundations already exist, so likely expansion areas include:

- richer notification UX
- better appointment reminders
- clearer notification states and preferences

## Design implications

The redesign should support both brand identity and product usability.

The visual system should communicate:

- premium beauty-industry taste
- calm operational clarity
- trust and structure
- high readability on mobile

The system should be ready for:

- RTL interfaces
- Persian typography
- Jalali dates and time-heavy screens
- dense calendar data
- status colors
- staff color coding
- analytics cards
- drawers, sheets, and bottom navigation
- installed-app behavior on phones

## Recommended designer deliverables

- logo system and brand mark
- final product name decision and brand usage rules
- primary and secondary color system
- neutral palette
- semantic state colors
- typography system for Persian-heavy UI
- icon and illustration direction
- app UI kit
- calendar visual language
- dashboard card style
- marketing site direction
- PWA / app icon set

## Prototype scope: important pages to design

The designer should provide clickable high-fidelity prototypes for all major product pages, not just a style direction.

### Core public and auth pages

- marketing / landing page
- login page
- manager signup page

### First-time setup flow

- onboarding overview
- salon profile step
- working hours step
- first service setup step
- first staff setup step
- first appointment step

### Core app navigation pages

- today page for manager
- today page for staff
- calendar page
- clients list page
- client profile page
- settings / more page for manager
- settings page for staff
- dashboard page
- retention / client follow-up page
- staff management page

### Important overlays and task flows

- new appointment drawer
- appointment detail drawer
- edit appointment flow
- appointment availability / suggested slot drawer
- new client drawer
- edit client drawer
- new service drawer
- edit service drawer
- add staff drawer
- staff services assignment drawer
- staff schedule drawer

### System and support states

- empty states
- loading states / skeleton direction
- offline / weak network state
- push notification permission state
- update available prompt for installed app

## Priority screens for the prototype

If the designer wants a clear priority order, these are the most important screens to get right first:

1. landing page
2. login page
3. today page
4. calendar page
5. new appointment flow
6. appointment detail / edit flow
7. clients list page
8. client profile page
9. settings / more page
10. dashboard page
11. retention page
12. staff management page

## What I want from the designer

I want the designer to deliver:

- a full visual identity direction
- a color theme and semantic color system
- typography direction
- component language for mobile-first product UI
- prototypes of all important pages
- key interaction flows for booking, editing, and managing appointments
- a consistent system that works across both marketing and in-app product surfaces

## Suggested one-line positioning

`A calm, mobile-first salon operations app for appointments, clients, staff, and daily workflow.`

## Short summary

This product is a salon management app focused on operational clarity for managers and staff. Today it already supports appointments, clients, services, staff, analytics, retention workflow, and mobile/PWA behavior. The next design system should be elegant enough for the beauty category, practical enough for dense scheduling screens, and flexible enough to grow into stronger offline, richer scheduling, and future multi-location experiences.
