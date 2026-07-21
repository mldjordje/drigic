# Dr Igić v2 — product incubator design

**Status:** Approved product direction; implementation pending written-spec review  
**Date:** 2026-07-21  
**Scope:** Upgrade the existing single-clinic product before extracting a separate SaaS

## 1. Decision and objective

Dr Igić will remain the production client and product laboratory. The immediate objective is not to introduce multi-tenancy, subscription billing, or self-service clinic onboarding. The objective is to turn the current application into a reliable, mobile-first clinic operating product, collect structured feedback from real use, and use that evidence to define the later SaaS.

The future SaaS will have a separate brand. Dr Igić will become its first tenant, reference implementation, and case study only after Dr Igić v2 has been validated in daily work.

This approach was selected over:

1. a cosmetic redesign, because it would not resolve operational friction or reliability risks;
2. an immediate multi-tenant rewrite, because it would add cost and security complexity before the product workflow is validated.

## 2. Product principles

1. **Daily operations first.** The admin home must answer: what is happening today, what needs attention, and what is the next action?
2. **Mobile operation is a primary use case.** Reception and clinical staff must be able to check, create, move, and complete appointments from a phone without desktop tables compressed into a small viewport.
3. **Trust before polish.** Broken Serbian characters, unclear failures, inaccessible dialogs, unsafe media handling, and unreliable notifications are release blockers.
4. **One source of truth.** Clinic identity, contact details, booking rules, working hours, status labels, and design tokens must not be duplicated across pages.
5. **SaaS-safe seams, not premature SaaS.** New code must accept an explicit clinic context at service boundaries where practical, but the database will remain single-clinic until evidence justifies tenancy work.
6. **Measure behavior, not opinions alone.** Product decisions will combine staff feedback with task time, feature use, booking outcomes, and failure data.

## 3. Current-system findings

The application already contains a substantial vertical product:

- Next.js 15 App Router and React 19;
- Neon Postgres with Drizzle ORM;
- OTP and Google authentication with client/admin roles;
- public service catalog, live booking, cancel/reschedule, and user appointment history;
- admin calendar, bookings, clients, Beauty Pass, treatment records, services, packages, promotions, media, content, VIP flows, and basic analytics;
- Resend email, in-app notifications, Web Push foundation, and Vercel cron jobs.

The main product and engineering weaknesses are:

- an ungrouped admin navigation containing nineteen modules;
- admin pages that rely on wide tables and coarse responsive behavior;
- inconsistent inline styling and no complete semantic design-token system;
- malformed UTF-8 text in important Serbian UI;
- inconsistent focus, dialog, loading, success, and error behavior;
- global single-clinic assumptions distributed through database queries and configuration;
- only two global roles, `client` and `admin`;
- public or database-embedded treatment media instead of a private-media policy;
- no automated test harness for booking concurrency, permissions, or key user journeys;
- weak operational visibility for notification failures and product usage.

## 4. Information architecture

### 4.1 Desktop and tablet admin

The primary navigation will be grouped by staff intent:

1. **Danas**
   - operational dashboard;
   - attention queue;
   - quick actions.
2. **Kalendar i termini**
   - calendar;
   - bookings list;
   - morning, afternoon, Sunday, and exceptional availability rules.
3. **Klijenti**
   - client directory;
   - client profile;
   - treatment timeline and Beauty Pass.
4. **Katalog**
   - services;
   - packages;
   - products/preparations;
   - promotions.
5. **Sadržaj**
   - media;
   - blog;
   - announcements.
6. **Uvidi**
   - operational and commercial analytics.
7. **Podešavanja**
   - clinic settings;
   - integrations;
   - staff access when role work begins.
8. **Pomoć**
   - tutorial and internal specification pages.

Permanently locked modules will not occupy primary navigation. Unavailable capabilities will appear only when they have a clear explanation or activation path.

### 4.2 Mobile admin

The mobile shell will expose no more than five top-level destinations:

- Danas;
- Kalendar;
- Klijenti;
- Termini;
- Više.

The page-specific primary action will remain reachable in a sticky action area. Examples include “Novi termin,” “Dodaj klijenta,” and “Sačuvaj.” Notifications and account access remain in the top bar. Navigation state, filters, scroll position, and unfinished safe form state must survive normal back navigation.

## 5. Core experiences

### 5.1 Today dashboard

The current counts-only dashboard will become an operational view containing:

- today’s schedule with current-time context;
- pending confirmations and VIP requests;
- cancellations, no-shows, and failed notification warnings;
- clients due for follow-up or correction;
- quick creation of an appointment or client;
- compact KPI trends below operational work, not above it.

Every alert must lead to a specific action. Decorative metrics and site-content counts are secondary.

### 5.2 Calendar and appointment management

- Phones default to an agenda/day view with date carousel and minimum 44 px touch rows.
- Desktop defaults to the existing week-oriented calendar.
- Week view on mobile is optional and visibly scrollable; it is not the default compressed layout.
- Status is communicated with text or icon plus color, never color alone.
- Creating, confirming, moving, completing, cancelling, or marking no-show uses per-record pending state.
- Appointment dialogs use a shared accessible modal with title, description, initial focus, focus trap, Escape dismissal when safe, and trigger-focus restoration.
- Changes write to the existing booking-status history and later expand into a general audit event.

### 5.3 Client workspace

The client profile becomes a chronological workspace:

- identity and contact summary;
- next appointment and outstanding action;
- appointment history;
- treatment timeline, products, notes, and authorized media;
- Beauty Pass information;
- communication and reminder history;
- staff actions appropriate to the current role.

Wide tables remain available on desktop. On phones, records transform into expandable cards with identity, date, status, and actions visible before expansion.

### 5.4 Public booking and self-service

The booking sequence remains:

`Treatment → Date → Time → Review → Confirmation`

The upgrade adds:

- a persistent mobile summary of treatment, date, time, duration, and quoted price;
- semantic single-choice date/time controls and an announced selection state;
- explanations for unavailable dates instead of unexplained disabled controls;
- clear inline validation and recovery actions;
- a confirmation receipt with next steps and add-to-calendar action;
- simpler rescheduling and cancellation with visible policy consequences;
- minimum 44 × 44 px touch targets and a 16 px mobile input baseline.

## 6. Design system

The interface will use a calm, clinical-premium visual language: warm neutral surfaces, high-contrast typography, restrained brand accents, and limited decorative effects. The admin prioritizes information clarity over marketing animation.

The implementation will introduce semantic tokens for:

- background, surface, raised surface, and overlay;
- primary, secondary, muted, inverse, and disabled text;
- border, focus, accent, success, warning, danger, and information states;
- spacing on a 4/8 px rhythm;
- radii, elevation, icon sizes, content widths, and z-index layers;
- motion durations in the 150–300 ms range with reduced-motion behavior.

Reusable primitives will include Button, IconButton, Field, Select, SearchField, Card, StatusBadge, Modal, Drawer, Toast/LiveRegion, EmptyState, Skeleton, DataTable, MobileRecordCard, PageHeader, StickyActionBar, and responsive layout containers.

All normal text must meet WCAG AA contrast. All interactive controls require a visible `:focus-visible` state. Icon-only controls require accessible names. Structural emoji icons are not allowed.

## 7. Architecture boundaries

The application remains a Next.js monolith, but feature work will introduce clearer boundaries:

1. **Route/UI layer** handles HTTP or interaction concerns only.
2. **Application services** enforce authorization, validate commands, orchestrate transactions, and return stable result/error contracts.
3. **Domain modules** contain booking, schedule, client, treatment, notification, and analytics rules.
4. **Repositories/storage adapters** contain Drizzle and object-storage details.
5. **Clinic configuration** is resolved centrally instead of being scattered through environment variables and components.

An explicit single-clinic context object will be passed through new service boundaries. Initially it resolves the current Dr Igić clinic configuration. Its contract should be replaceable by a verified tenant context later, without adding tenant columns in this phase.

API responses will converge on a consistent envelope containing success data or a stable error code, user-safe message, and optional field errors. Request handlers must not duplicate business rules already owned by application services.

## 8. Data and side-effect flow

For state-changing operations:

1. authenticate the actor;
2. authorize the action;
3. validate the request;
4. execute database changes transactionally;
5. record the relevant status/audit event;
6. enqueue side effects through a reliable job/outbox boundary;
7. return the committed result immediately;
8. deliver email/push asynchronously with idempotency, retry, and visible failure state.

The existing booking advisory-lock approach will be retained and tested. Notification delivery must not determine whether a successfully committed appointment appears to have failed.

Treatment media will move toward private object storage with authorized download URLs. The base64-in-database fallback will not be used for new clinical uploads once private storage is available.

## 9. Roles and permissions

Full multi-tenant membership is deferred, but global `admin` access must not remain the long-term operating model. The first permission design will define:

- owner/administrator;
- receptionist;
- practitioner;
- content/marketing operator;
- client.

The first implementation may introduce permissions incrementally, beginning with sensitive treatment records/media and clinic settings. Permissions must be enforced in APIs and services, not only by hiding UI controls.

## 10. Error handling and recovery

- Field errors appear beside the responsible field and focus moves to the first invalid input after submission.
- Blocking errors use an assertive accessible alert and state the recovery action.
- Success and background progress use polite live regions and non-blocking notifications.
- Mutations use per-record pending state; one appointment update must not disable the entire page.
- Destructive actions require explicit confirmation and, where safe, an undo period.
- Timeouts and delivery failures expose retry actions.
- Empty states explain why the view is empty and provide the relevant next action.
- Unsaved long-form work is protected against accidental modal or page dismissal.

## 11. Measurement and feedback

The Dr Igić validation period will measure:

- admin feature usage and task frequency;
- time to create, find, move, and complete an appointment;
- booking conversion and abandonment by step;
- cancellation and no-show rates;
- schedule utilization;
- notification delivery and failure rates;
- repeat-visit and rebooking behavior;
- staff-reported friction linked to a route and workflow.

The admin will include a lightweight structured feedback action. Feedback is tagged with route, role, device class, and optional workflow context, without capturing clinical content.

## 12. Delivery phases

### Phase 0 — baseline and trust

- automated test harness and CI baseline;
- UTF-8 repair and Serbian-copy verification;
- semantic design tokens and core accessible primitives;
- shared feedback, loading, and modal behavior;
- focused security/privacy fixes for analytics, authentication abuse, and clinical media;
- migration-ledger and environment cleanup.

### Phase 1 — admin shell and daily operations

- grouped navigation and responsive shell;
- Today dashboard;
- mobile day/agenda calendar;
- consistent page headers, actions, cards, tables, and mobile record views;
- booking-list and client-list modernization.

### Phase 2 — core workflow depth

- client timeline;
- faster appointment creation and lifecycle actions;
- reliable notification jobs/outbox;
- role/permission foundation;
- operational analytics and source attribution.

### Phase 3 — measured growth features

Selected only after Dr Igić feedback and metrics. Candidate capabilities are waitlist/backfill, WhatsApp or SMS, deposits, digital consent, review requests, loyalty/referrals, and inventory usage.

### Phase 4 — SaaS extraction decision

After a 6–8 week validation period, define the separate product brand, ideal customer profile, SaaS MVP, tenant model, billing, onboarding, support model, and data-migration path. Multi-tenancy starts only after this decision gate.

## 13. Testing and release gates

The minimum automated suite will cover:

- authentication and permission decisions;
- booking quote, availability, conflict, create, cancel, reschedule, complete, and no-show flows;
- concurrent attempts for the same resource and time;
- notification idempotency and retries;
- clinic-configuration resolution;
- critical admin APIs;
- public booking and primary mobile admin journeys;
- accessibility checks for navigation, dialogs, forms, and status feedback;
- database migration from empty and from the current production baseline.

Every major UI work package is verified at 375 px, 768 px, 1024 px, and desktop width, including keyboard-only navigation and reduced motion. Release requires no horizontal page scrolling on phone layouts, no inaccessible blocking dialog, and no new raw clinic-specific configuration outside the central configuration boundary.

## 14. Explicit non-goals for Dr Igić v2

- multi-tenant database isolation;
- clinic self-signup and onboarding;
- SaaS subscription billing and plan entitlements;
- custom domains per clinic;
- enterprise SSO or SCIM;
- a marketplace or generalized healthcare platform;
- speculative AI features before core operations are reliable.

## 15. Orchestration and change-control model

Implementation is divided into small work packages with disjoint file ownership wherever possible. Execution agents receive exact scope, constraints, acceptance criteria, and required tests. The orchestrator reviews every change, checks for overlap with user-owned files, runs focused verification, and integrates only after the package satisfies its acceptance criteria.

No package may silently broaden scope into full SaaS work. Any database migration, authorization change, clinical-media change, or destructive operation receives an explicit integration review before release.

## 16. Definition of success

Dr Igić v2 is successful when staff can complete the primary daily workflows comfortably on a phone, the system reliably records and communicates appointment changes, sensitive data has a defensible access path, operational failures are visible and recoverable, and the team has enough measured usage and feedback to define the future SaaS without guessing.
