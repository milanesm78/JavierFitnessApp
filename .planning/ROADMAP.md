# Roadmap: JavierFitness

## Overview

JavierFitness ships in four phases driven by data dependencies: foundation and auth first (everything depends on users and the schema), then the core training loop (the product's reason to exist), then progress visualization and body measurements (require accumulated workout data), and finally auto-progression intelligence (requires historical patterns). Each phase delivers a complete, usable capability -- the app is functional after Phase 2 and gets progressively smarter.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation and Exercise Library** - Auth, roles, i18n, responsive scaffold, and exercise CRUD
- [ ] **Phase 2: Core Training Loop** - Plan builder, workout logging, client/trainer dashboards
- [ ] **Phase 3: Measurements and Progress** - Body measurement forms, strength and body composition charts
- [ ] **Phase 4: Auto-Progression** - Smart weight increase suggestions based on logged performance

## Phase Details

### Phase 1: Foundation and Exercise Library
**Goal**: Trainer and clients can log in to their respective portals, trainer can build an exercise library, and the app works bilingually on mobile browsers
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, EXER-01, EXER-02, INFR-01, INFR-02, INFR-03
**Success Criteria** (what must be TRUE):
  1. Trainer can register, log in, and land on the trainer portal; client can register, be activated by trainer, log in, and land on the client portal
  2. User sessions survive browser refresh without requiring re-login
  3. Trainer can create, edit, and delete exercises with name and YouTube video link
  4. User can toggle between Spanish and English and the entire interface updates accordingly
  5. All pages are usable on a mobile phone browser without horizontal scrolling, and weight inputs accept both comma and period as decimal separators
**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold, Supabase schema, i18n, Tailwind + shadcn/ui, utilities
- [x] 01-02-PLAN.md — Auth system, role-based routing, portal layouts, theme toggle, client activation
- [x] 01-03-PLAN.md — Exercise library CRUD, DecimalInput component (Tasks 1 & 2 complete; Task 3 human-verify pending)

### Phase 2: Core Training Loop
**Goal**: Trainer can build personalized training plans and clients can view their workouts, watch exercise videos, and log every set at the gym -- the complete daily training workflow
**Depends on**: Phase 1
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06, WLOG-01, WLOG-02, WLOG-03, WLOG-04, EXER-03, DASH-01, DASH-02, DASH-03
**Success Criteria** (what must be TRUE):
  1. Trainer can create a training plan for a client organized by training days, with exercises prescribing sets, reps, and weight, and can define the cycle length per client
  2. Editing a plan creates a new version for the next cycle while preserving historical workout data tied to the previous version
  3. Client can view their plan grouped by training day, tap an exercise to watch its YouTube video inline, start a workout session, and log weight and reps for each set
  4. Client can view their workout history showing past sessions with all logged sets and session duration
  5. Trainer can view a list of all clients with activity status, see color-coded indicators for today's workout completion, and drill into any client's plan and logs
**Plans:** 4 plans

Plans:
- [ ] 02-01-PLAN.md — Database schema, types, Zod schemas, query hooks, shared utilities (Phase 2 data layer)
- [ ] 02-02-PLAN.md — Training plan builder with nested form, exercise picker, versioning, trainer pages
- [ ] 02-03-PLAN.md — Client plan view, YouTube exercise embed, workout session logging with pre-fill and steppers
- [ ] 02-04-PLAN.md — Workout history, trainer dashboard with client status indicators, end-to-end verification

### Phase 3: Measurements and Progress
**Goal**: Clients and trainer can track body composition over time and visualize strength and measurement progress through charts
**Depends on**: Phase 2
**Requirements**: BODY-01, BODY-02, BODY-03, TRCK-01, TRCK-02, TRCK-03
**Success Criteria** (what must be TRUE):
  1. Client can fill a monthly body measurement form covering weight, height, skin folds, bone diameters, and circumferences, with input validation preventing data entry errors
  2. Client and trainer can view measurement history and see body composition changes as line charts over time
  3. Client can view strength progress as line charts showing weight per exercise over time
  4. Trainer can view any client's strength and body measurement progress charts
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Auto-Progression
**Goal**: The app intelligently suggests weight increases when clients demonstrate readiness, completing the smart coaching loop
**Depends on**: Phase 2
**Requirements**: PROG-01, PROG-02
**Success Criteria** (what must be TRUE):
  1. When a client logs 15+ reps on an exercise, the app displays a suggestion to increase weight by 2.5kg for the next session
  2. The suggestion is clearly presented as a recommendation that the client or trainer must confirm before it takes effect
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Exercise Library | 3/3 | Awaiting human verification | - |
| 2. Core Training Loop | 0/4 | Not started | - |
| 3. Measurements and Progress | 0/2 | Not started | - |
| 4. Auto-Progression | 0/1 | Not started | - |
