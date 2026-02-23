# Requirements: JavierFitness

**Defined:** 2026-02-22
**Core Value:** Clients always have their personalized training plan at their fingertips -- with video guidance, easy workout logging, and visible progress that keeps them engaged and coming back.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can create account with email and password
- [ ] **AUTH-02**: User is assigned a role (trainer or client) upon registration
- [ ] **AUTH-03**: Client account requires trainer activation before accessing training features
- [ ] **AUTH-04**: User session persists across browser refresh
- [ ] **AUTH-05**: Trainer and client are routed to their respective portals after login

### Exercise Library

- [ ] **EXER-01**: Trainer can create exercises with name and YouTube video link
- [ ] **EXER-02**: Trainer can edit and delete exercises from the library
- [ ] **EXER-03**: Client can view exercise with inline YouTube video embed from their workout view

### Training Plans

- [ ] **PLAN-01**: Trainer can create a training plan for a specific client
- [ ] **PLAN-02**: Trainer can organize a plan by training days (Day A, Day B, etc.)
- [ ] **PLAN-03**: Trainer can add exercises to a training day with prescribed sets, reps, and weight
- [ ] **PLAN-04**: Client can view their assigned training plan grouped by training day
- [ ] **PLAN-05**: Trainer can define training cycle length per client
- [ ] **PLAN-06**: Plans are versioned -- editing a plan creates a new version for the next cycle, preserving historical data

### Workout Logging

- [ ] **WLOG-01**: Client can start a workout session for a training day
- [ ] **WLOG-02**: Client can log weight and reps for each set of each exercise
- [ ] **WLOG-03**: Workout session tracks start and completion time
- [ ] **WLOG-04**: Client can view their workout history (past sessions with logged sets)

### Auto-Progression

- [ ] **PROG-01**: App detects when client logs 15+ reps on an exercise and suggests +2.5kg for next session
- [ ] **PROG-02**: Auto-progression is a suggestion -- client or trainer confirms before applying

### Body Measurements

- [ ] **BODY-01**: Client can fill monthly body measurement form with full anthropometric protocol (weight, height, skin folds, bone diameters, circumferences)
- [ ] **BODY-02**: Measurement form validates input ranges to prevent data entry errors
- [ ] **BODY-03**: Client and trainer can view measurement history

### Progress Tracking

- [ ] **TRCK-01**: Client can view strength progress as line charts (weight per exercise over time)
- [ ] **TRCK-02**: Client can view body measurement progress as line charts (measurements over time)
- [ ] **TRCK-03**: Trainer can view any client's strength and body progress charts

### Trainer Dashboard

- [ ] **DASH-01**: Trainer can view list of all clients with activity status (active, inactive, pending)
- [ ] **DASH-02**: Trainer sees color-coded indicators showing which clients completed today's workout
- [ ] **DASH-03**: Trainer can select a client to view their plan, logs, and progress

### Infrastructure

- [ ] **INFR-01**: App supports Spanish and English with language toggle
- [ ] **INFR-02**: App is fully responsive and usable on mobile browsers at the gym
- [ ] **INFR-03**: All weights accept both comma and period as decimal separators

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Notifications

- **NOTF-01**: Client receives reminder if no workout logged in 3+ days
- **NOTF-02**: Trainer receives summary of client activity weekly

### Advanced Analytics

- **ANAL-01**: Trainer can compare client progress across training cycles
- **ANAL-02**: Body fat percentage calculated from skin fold measurements

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| In-app payments | Javier handles payments outside the app (cash, Bizum) |
| Real-time chat | WhatsApp already handles trainer-client communication |
| Push notifications | Retention comes from product value, not nagging |
| Multi-trainer support | Single trainer architecture -- Javier only |
| Native mobile app | Responsive web app is sufficient |
| Social features / leaderboards | Privacy concerns, too few users for social features |
| Nutrition tracking / meal plans | Separate domain, out of scope |
| AI-generated workout plans | Trainer expertise is the value -- app is a tool, not a replacement |
| Wearable device integration | Complexity without proportional value for strength training |
| Offline mode / PWA | Standard web app; gym connectivity assumed sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| EXER-01 | Phase 1 | Pending |
| EXER-02 | Phase 1 | Pending |
| EXER-03 | Phase 2 | Pending |
| PLAN-01 | Phase 2 | Pending |
| PLAN-02 | Phase 2 | Pending |
| PLAN-03 | Phase 2 | Pending |
| PLAN-04 | Phase 2 | Pending |
| PLAN-05 | Phase 2 | Pending |
| PLAN-06 | Phase 2 | Pending |
| WLOG-01 | Phase 2 | Pending |
| WLOG-02 | Phase 2 | Pending |
| WLOG-03 | Phase 2 | Pending |
| WLOG-04 | Phase 2 | Pending |
| PROG-01 | Phase 4 | Pending |
| PROG-02 | Phase 4 | Pending |
| BODY-01 | Phase 3 | Pending |
| BODY-02 | Phase 3 | Pending |
| BODY-03 | Phase 3 | Pending |
| TRCK-01 | Phase 3 | Pending |
| TRCK-02 | Phase 3 | Pending |
| TRCK-03 | Phase 3 | Pending |
| DASH-01 | Phase 2 | Pending |
| DASH-02 | Phase 2 | Pending |
| DASH-03 | Phase 2 | Pending |
| INFR-01 | Phase 1 | Pending |
| INFR-02 | Phase 1 | Pending |
| INFR-03 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-02-22*
*Last updated: 2026-02-23 after roadmap creation*
