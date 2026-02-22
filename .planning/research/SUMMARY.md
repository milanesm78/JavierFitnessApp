# Project Research Summary

**Project:** JavierFitness -- Personal Training Coaching Platform
**Domain:** Fitness coaching SaaS (trainer-client, workout logging, body composition tracking)
**Researched:** 2026-02-21
**Confidence:** MEDIUM

## Executive Summary

JavierFitness is a CRUD-heavy, role-based web application for a single personal trainer managing 20-50 clients in Spain. The product's core loop is: trainer prescribes training plans, clients log per-set workout data on their phones at the gym, and both parties track progress over time through charts. This is a well-understood application type -- relational data model, two user roles, form-heavy input, time-series visualization -- and experts build it with a full-stack framework backed by a managed PostgreSQL database. The recommended approach is Next.js (App Router) + Supabase, deployed on Vercel, with bilingual support (Spanish/English) baked in from day one.

The most significant risk is getting the data model wrong. The workout data hierarchy (plans -> days -> exercises -> sessions -> sets) is deeply relational and must be normalized from the start. If plans are mutable or workout logs are flattened, progress tracking and auto-progression features become impossible to build without a painful migration. The second major risk is mobile UX: clients log workouts in a gym with sweaty hands between sets. If logging a single set takes more than 3-4 taps, compliance collapses and the product has no data to work with. Both risks are addressable through upfront design -- the data model must be validated before any code is written, and the workout logging UI needs prototype-level testing on actual phones.

The stack is mature and well-documented: Next.js, Supabase (PostgreSQL + Auth + RLS), Tailwind CSS, shadcn/ui, React Hook Form, Zod, Recharts, and next-intl. No exotic technologies. No custom backend needed. The architecture is a single application with role-based routing (trainer portal and client portal sharing components), backed by Supabase's auto-generated REST API with Row Level Security enforcing data isolation at the database level. At 20-50 users, this is a one-server, one-database, zero-infrastructure-complexity project.

## Key Findings

### Recommended Stack

The stack is deliberately boring and well-supported. Next.js 15 with App Router provides server-rendered pages, co-located API routes, and middleware for auth guards. Supabase eliminates the need for a custom backend by providing managed PostgreSQL, email/password auth, and Row Level Security out of the box. The free tiers of both Vercel and Supabase comfortably handle the target user base.

**Core technologies:**
- **Next.js 15 (App Router):** Full-stack framework -- server components, API routes, middleware for role guards, i18n routing
- **Supabase (PostgreSQL 15+):** Database, auth, RLS for data isolation -- eliminates custom backend entirely
- **TypeScript 5:** Non-negotiable for a data-heavy app with complex nested schemas
- **Tailwind CSS + shadcn/ui:** Rapid UI development with accessible, customizable components you own
- **React Hook Form + Zod:** Performant form handling critical for the workout logging experience (minimal re-renders)
- **Recharts:** Lightweight React-native charting for strength progression and body measurement line charts
- **next-intl:** Purpose-built i18n for Next.js App Router with Spanish/English message catalogs
- **TanStack Query:** Server state caching with optimistic updates for workout logging

**Explicitly avoid:** Redux/Zustand (no complex client state), tRPC (redundant with Supabase), Prisma/Drizzle (conflicts with Supabase's type generation), NextAuth (conflicts with Supabase Auth), GraphQL (unnecessary at this scale).

### Expected Features

**Must have (table stakes):**
- Trainer portal with client list and status dashboard
- Client portal with personal dashboard showing current plan
- Exercise library with YouTube video links (trainer CRUD, client read)
- Personalized training plans organized by training day
- Per-set workout logging (weight + reps for each set)
- Strength progress charts (per exercise over time)
- Body measurement progress charts (anthropometric protocol)
- Responsive mobile web (critical -- clients log at the gym on phones)
- Bilingual UI (Spanish primary, English secondary)
- Email/password auth with trainer vs. client roles

**Should have (differentiators):**
- Auto-progression suggestions (15+ reps triggers +2.5kg recommendation)
- Detailed anthropometric tracking (6+ skin fold sites, bone diameters, circumferences) -- rare in competitor platforms
- Training cycle management (explicit cycle boundaries, plan versioning between cycles)
- Workout completion visibility on trainer dashboard (color-coded client status)
- Inline YouTube video embedding in workout view

**Defer indefinitely (anti-features):**
- In-app payments/billing (Javier uses cash/Bizum)
- Real-time chat (clients use WhatsApp)
- Push notifications, native mobile app, social features
- Multi-trainer support, nutrition tracking, AI-generated plans
- Wearable integrations, complex periodization modeling

### Architecture Approach

Single Next.js application with role-based dual portals (trainer and client), Supabase as the entire backend. The architecture is a classic CRUD app with read-heavy dashboards and time-series charting. No real-time features, no file uploads, no payment processing. Data flows through six modules (Auth, Exercise Library, Training Plans, Workout Logging, Measurements, Progress/Analytics) accessed via Supabase's REST API with RLS policies enforcing data isolation at the database level.

**Major components:**
1. **Auth Module** -- Email/password login, two roles (trainer/client), JWT sessions, route guards via Next.js middleware
2. **Exercise Library** -- Simple CRUD (name, YouTube video ID, notes); trainer writes, everyone reads
3. **Training Plan Module** -- Most complex component; nested plan -> days -> exercises with prescribed values; immutable once active
4. **Workout Log Module** -- Core client write path; per-set logging with session grouping; pre-filled from prescription
5. **Measurement Module** -- Monthly anthropometric form with range validation; flat column storage (not EAV)
6. **Progress/Analytics Module** -- SQL aggregation queries for line charts; on-read computation (no pre-aggregation needed at this scale)

**Key architectural decisions:**
- Single app with role-based routing, not two separate apps
- Plans are immutable once active (edits staged for next cycle)
- Measurements stored as flat columns, not entity-attribute-value
- Progress computed on-read via indexed SQL, not pre-computed
- YouTube video IDs stored (not full URLs), with thumbnail-first display

### Critical Pitfalls

1. **Flattened workout data model** -- Must normalize the full hierarchy (plan -> day -> exercise -> session -> set) from day one. Design around the hardest queries first: per-set progress over time, auto-progression detection. Retrofitting is a rewrite.
2. **Plan mutation corrupts history** -- Plans must be immutable once active. Snapshot prescribed values into workout sessions so historical logs survive plan changes. This is a Phase 1 design decision.
3. **Gym-floor UX failure on mobile** -- Large touch targets (56px+), number steppers (+/-2.5kg, +/-1 rep), pre-fill from prescription, one-tap "complete as prescribed." Test with one thumb on a real phone. If logging a set takes more than 3-4 taps, iterate.
4. **Measurement data entry errors** -- Enforce per-field ranges (weight 30-250kg, skinfolds 2-60mm, etc.). Show confirmation warnings for suspicious changes (>10kg weight change month-over-month). Display units prominently.
5. **i18n as afterthought** -- Set up next-intl infrastructure before any UI. Every string through the translation function from the start. Handle decimal separators (Spanish comma vs English period) in the data layer.

## Implications for Roadmap

Based on combined research, here is the suggested phase structure. The ordering is driven by data dependencies (you cannot log workouts without plans, you cannot chart progress without logs) and risk mitigation (get the data model and mobile UX right early).

### Phase 1: Foundation and Data Layer
**Rationale:** Everything depends on auth, the database schema, and i18n infrastructure. The data model is the highest-risk element -- getting it wrong means a rewrite. This phase also sets up the exercise library, which is a prerequisite for training plans.
**Delivers:** Working auth (trainer + client roles), database schema with RLS policies, i18n scaffolding, exercise library CRUD, client registration with invite-link flow.
**Addresses:** Authentication, client registration, exercise library, bilingual infrastructure (from FEATURES.md table stakes).
**Avoids:** Pitfall 1 (flat data model), Pitfall 2 (mutable plans -- design immutability into schema), Pitfall 5 (YouTube brittleness -- parse video IDs at entry), Pitfall 7 (i18n afterthought), Pitfall 10 (auth too coarse/complex), Pitfall 12 (no approval flow), Pitfall 14 (decimal handling).

### Phase 2: Core Training Loop
**Rationale:** This IS the product. The trainer builds plans, clients see their workout for the day, and they log per-set data. This phase must nail the mobile UX for gym-floor logging. Without this working well, nothing else matters.
**Delivers:** Training plan builder (trainer), client workout day view with YouTube embeds, per-set workout logging, trainer dashboard with client completion visibility.
**Addresses:** Personalized training plans, per-set workout logging, client dashboard, trainer dashboard, responsive mobile web, YouTube embedding (from FEATURES.md table stakes and differentiators).
**Avoids:** Pitfall 3 (gym-floor UX failure -- large touch targets, pre-filled values, minimal taps), Pitfall 8 (cycle boundary logic -- design plan activation model), Pitfall 13 (rest-between-sets workflow).

### Phase 3: Progress Tracking and Body Composition
**Rationale:** With workout data flowing from Phase 2, progress charts become meaningful. Body measurements are independent of the training loop and can be built alongside charts. This phase delivers the visual proof that the program works -- a key retention driver.
**Delivers:** Strength progress charts (per exercise over time), body measurement entry form (full anthropometric protocol), body composition progress charts, measurement history.
**Addresses:** Strength progress charts, body measurement progress charts, detailed anthropometric tracking (from FEATURES.md table stakes and differentiators).
**Avoids:** Pitfall 4 (measurement data entry errors -- range validation, outlier warnings), Pitfall 9 (chart performance -- aggregated queries, date range defaults, proper indexing).

### Phase 4: Smart Features and Polish
**Rationale:** Auto-progression requires accumulated workout data. Training cycle management is an optimization layer on a working product. These features add intelligence but the product is usable without them.
**Delivers:** Training cycle management (explicit cycle boundaries, plan versioning), auto-progression suggestions (15+ rep detection), workout logging polish (rest timer indicator, session history).
**Addresses:** Auto-progression suggestions, training cycle management (from FEATURES.md differentiators).
**Avoids:** Pitfall 6 (naive auto-progression logic -- clarify rules with Javier, check all sets, make configurable), Pitfall 8 (underspecified cycle boundaries -- explicit cycle model, trainer-initiated transitions).

### Phase Ordering Rationale

- **Data model first** because the two most critical pitfalls (flat data model, mutable plans) are design-time decisions that cannot be fixed later without a migration. Every researcher flagged this.
- **i18n in Phase 1** because all four research files agree: retrofitting bilingual support is a multi-day refactor that touches every component. Spanish-first with English as secondary.
- **Training loop before charts** because charts need data. Shipping logging first lets real workout data accumulate before progress visualization is built.
- **Measurements parallel to charts** because body measurements have no dependency on training plans or workout logs -- only on auth and the client. Building the form alongside chart infrastructure is efficient.
- **Smart features last** because auto-progression needs historical data to detect patterns, and cycle management is an optimization of a working plan system. Both are meaningless without a functioning core loop.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Core Training Loop):** The training plan builder is the most complex feature -- nested data (plan -> days -> exercises with prescribed values), plan activation model, and the gym-floor mobile UX all require careful design. Recommend `/gsd:research-phase` for plan builder data flow and mobile workout logging UX patterns.
- **Phase 3 (Progress Tracking):** Chart query strategy (aggregation approach, indexing, date range handling) and the anthropometric measurement validation ranges should be verified with Javier's specific protocol. Recommend phase research for chart data queries.
- **Phase 4 (Smart Features):** Auto-progression rule specifics must be clarified with Javier (which sets count, how many sessions confirm threshold). Cycle management data model needs detailed design.

Phases with standard patterns (skip `/gsd:research-phase`):
- **Phase 1 (Foundation):** Auth with Supabase, CRUD exercise library, i18n setup with next-intl -- all extremely well-documented with official guides and examples. Standard patterns apply.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | All technologies are mature and well-documented. Version numbers need verification (training data cutoff May 2025). No exotic choices. |
| Features | MEDIUM | Feature categorization based on training data knowledge of competitor platforms (TrueCoach, Trainerize, etc.) not verified against 2026 offerings. Feature priorities validated against PROJECT.md requirements. |
| Architecture | MEDIUM-HIGH | Standard CRUD + relational patterns. Data model is well-specified and appropriate. Supabase RLS for data isolation is proven. No novel architectural challenges. |
| Pitfalls | MEDIUM | Domain pitfalls are based on common fitness app development patterns. Anthropometric measurement ranges need verification with Javier. Auto-progression rules need clarification with the trainer. |

**Overall confidence:** MEDIUM -- The patterns are well-established and the technology choices are sound, but web search was unavailable during research. Specific version numbers and competitor landscape details should be verified before implementation begins.

### Gaps to Address

- **Exact library versions:** All version numbers are from May 2025 training data. Run `npm view [package] version` for each dependency before project initialization.
- **Anthropometric measurement ranges:** The valid ranges for skin fold measurements, bone diameters, and circumferences should be confirmed with Javier's specific protocol. The ranges in PITFALLS.md are general exercise science standards.
- **Auto-progression rule specifics:** "15+ reps triggers +2.5kg suggestion" needs clarification: Which sets count? How many sessions confirm the threshold? Is the increment always 2.5kg or exercise-dependent? This must be resolved with Javier before Phase 4.
- **Training cycle workflow:** How does Javier currently manage cycle transitions? Manual end dates? Fixed duration? This determines the cycle management UX in Phase 4.
- **Supabase free tier limits:** Verify current Supabase free tier (database size, auth limits, API rate limits) against projected usage. As of May 2025 knowledge: 500MB DB, 50K MAU, which is more than sufficient.
- **Spanish locale formatting:** Confirm date format (dd/mm/yyyy), decimal separator (comma), and weight unit (kg only, no lb conversion needed) preferences for the Spanish user base.
- **GDPR compliance:** European data residency for Supabase Cloud should be confirmed (Spain-based users with personal health-adjacent data).
- **Spanish fitness terminology:** Translation keys for anthropometric terms, exercise categories, and UI labels need native speaker review.

## Sources

### Primary (HIGH confidence)
- PROJECT.md requirements and constraints -- direct project context
- Next.js official documentation (nextjs.org/docs) -- App Router, Server Components, Middleware
- Supabase official documentation (supabase.com/docs) -- Auth, RLS, TypeScript generation, SSR helpers
- shadcn/ui documentation (ui.shadcn.com) -- component catalog, Radix primitives
- React Hook Form documentation (react-hook-form.com) -- performance patterns, Zod resolver
- YouTube oEmbed API -- stable, well-documented endpoint for video validation

### Secondary (MEDIUM confidence)
- Fitness coaching platform feature analysis (TrueCoach, Trainerize, TrainHeroic, My PT Hub, FitSW) -- based on training data, not live verification
- Anthropometric measurement protocols and valid ranges -- exercise science standards, should be confirmed with Javier
- Recharts, next-intl, TanStack Query, date-fns documentation -- established libraries, API patterns stable

### Tertiary (LOW confidence)
- Exact package version numbers -- based on May 2025 training data, must be verified via npm before project initialization
- Supabase free tier limits -- may have changed since training data cutoff
- Competitive landscape pricing and feature details -- may have changed since training data cutoff

---
*Research completed: 2026-02-21*
*Ready for roadmap: yes*
