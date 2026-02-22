# Architecture Patterns

**Domain:** Fitness coaching web platform (trainer + client portals)
**Researched:** 2026-02-21
**Confidence:** MEDIUM (based on established web app patterns; no external sources verified due to tool constraints)

## Recommended Architecture

Single-page application with a role-based dual-portal frontend, a RESTful (or tRPC) API backend, and a relational database. This is a classic CRUD-heavy application with read-heavy dashboards and time-series data for progress tracking. No real-time features, no file uploads, no payment processing -- this keeps the architecture simple.

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (SPA)                       │
│                                                          │
│  ┌─────────────────────┐  ┌────────────────────────┐    │
│  │   Trainer Portal     │  │    Client Portal        │    │
│  │                      │  │                         │    │
│  │  - Exercise Library  │  │  - Dashboard            │    │
│  │  - Client Mgmt       │  │  - My Plan (by day)     │    │
│  │  - Plan Builder       │  │  - Workout Logger       │    │
│  │  - Progress Viewer   │  │  - Measurements Form    │    │
│  │  - Measurement View  │  │  - Progress Charts      │    │
│  └─────────────────────┘  └────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Shared Components                     │   │
│  │  - Auth (login/register), i18n, Layout, Charts    │   │
│  │  - YouTube Embed, Exercise Card, Navigation       │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/JSON (REST or tRPC)
                       ▼
┌──────────────────────────────────────────────────────────┐
│                      API LAYER                            │
│                                                           │
│  ┌────────────┐ ┌────────────┐ ┌──────────────────────┐ │
│  │ Auth Module │ │ Exercise   │ │ Training Plan Module │ │
│  │             │ │ Module     │ │                      │ │
│  └────────────┘ └────────────┘ └──────────────────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌──────────────────────┐ │
│  │ Measurement│ │ Workout    │ │ Progress/Analytics   │ │
│  │ Module     │ │ Log Module │ │ Module               │ │
│  └────────────┘ └────────────┘ └──────────────────────┘ │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Middleware: Auth Guard, Role Check, i18n, CORS    │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │ SQL queries (via ORM)
                       ▼
┌──────────────────────────────────────────────────────────┐
│                   DATABASE (PostgreSQL)                    │
│                                                           │
│  users, exercises, training_plans, plan_days,             │
│  plan_exercises, workout_sessions, workout_sets,          │
│  body_measurements                                        │
└──────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Auth Module** | Login, registration, JWT/session management, role assignment (trainer vs client) | All other modules (middleware), Database |
| **Exercise Library** | CRUD for exercises (name + YouTube URL). Trainer-only writes, client reads | Training Plan Module, Database |
| **Training Plan Module** | Create/edit plans per client: training days, exercises per day, prescribed sets/reps/weight. Manages cycle boundaries | Exercise Library, Workout Log Module, Database |
| **Workout Log Module** | Client logs actual weight and reps per set per exercise per session. Core write-heavy path | Training Plan Module (reads plan), Progress Module, Database |
| **Measurement Module** | Monthly body measurement forms (skin folds, bone diameters, circumferences). Client submits, trainer views | Progress Module, Database |
| **Progress/Analytics Module** | Aggregates workout logs and measurements into time-series data for line charts. Computes auto-progression suggestions | Workout Log Module, Measurement Module, Database |
| **i18n Layer** | Bilingual string management (ES/EN). Client-side with server-fallback | All UI components |
| **Frontend Trainer Portal** | Exercise management, client list, plan builder, progress viewer | API Layer (all modules) |
| **Frontend Client Portal** | Dashboard, plan viewer, workout logger, measurement form, progress charts | API Layer (subset of modules) |

### Data Flow

**Plan Creation Flow (Trainer):**
```
Trainer creates exercise → Exercise stored in library
Trainer creates plan for Client X →
  Plan → has many PlanDays →
    each PlanDay → has many PlanExercises →
      each PlanExercise → references Exercise, has prescribed sets/reps/weight
Plan linked to client with cycle start/end dates
```

**Workout Logging Flow (Client):**
```
Client opens today's training day →
  App loads PlanDay with PlanExercises →
    For each exercise, client sees prescribed sets/reps/weight →
      Client logs actual weight + reps for each set →
        WorkoutSession created (date, client, planDay) →
          WorkoutSets created (exercise, set_number, actual_weight, actual_reps)
```

**Auto-Progression Flow:**
```
After client logs a set with reps >= 15 →
  System flags this exercise for progression suggestion →
    Next time client opens this exercise:
      UI shows suggestion: "You hit 15+ reps. Consider +2.5kg next time" →
        Client or trainer confirms/dismisses suggestion
```

**Measurement Flow:**
```
Client fills monthly measurement form →
  BodyMeasurement record created (date, client_id, all fields) →
    Progress module aggregates measurements over time →
      Line charts rendered on dashboard
```

**Progress Chart Flow:**
```
Client or Trainer requests progress chart →
  API queries workout_sets grouped by exercise + date →
    Returns time-series: [{date, max_weight, total_volume, best_set}] →
      Frontend renders line chart (Chart.js or Recharts)

  API queries body_measurements for client ordered by date →
    Returns time-series per metric →
      Frontend renders line chart per measurement type
```

## Core Data Model

This is the heart of the architecture. Getting the data model right determines whether everything else is easy or painful.

### Entity Relationship Overview

```
User (role: trainer|client)
  │
  ├── Exercise (belongs to trainer, shared across clients)
  │     - name, youtube_url, description, muscle_group
  │
  ├── TrainingPlan (assigned to one client)
  │     - client_id, name, cycle_start, cycle_end, status (active/draft/archived)
  │     │
  │     └── PlanDay (e.g., "Day 1 - Push", "Day 2 - Pull")
  │           - day_number, name
  │           │
  │           └── PlanExercise (exercise in context of a plan day)
  │                 - exercise_id, order, prescribed_sets, prescribed_reps, prescribed_weight
  │
  ├── WorkoutSession (one client doing one plan_day on one date)
  │     - client_id, plan_day_id, date, completed_at, notes
  │     │
  │     └── WorkoutSet (one set of one exercise in a session)
  │           - plan_exercise_id, set_number, actual_weight, actual_reps, rpe (optional)
  │
  └── BodyMeasurement (one monthly record per client)
        - client_id, date
        - weight, height
        - skinfold_triceps, skinfold_subscapular, skinfold_suprailiac,
          skinfold_abdominal, skinfold_thigh, skinfold_calf
        - bone_humeral, bone_femoral, bone_bistyloidal
        - circ_arm, circ_chest, circ_waist, circ_hip, circ_thigh, circ_calf
```

### Key Data Model Decisions

| Decision | Rationale |
|----------|-----------|
| **PlanExercise as join table with prescribed values** | Separates the exercise definition from its prescription in a specific plan. Same exercise can appear with different sets/reps/weight in different plans or different days |
| **WorkoutSession + WorkoutSet separation** | A session groups all sets for a training day. Sets are the atomic unit of logging. This enables per-set tracking while maintaining session context |
| **Cycle management via plan dates** | Plan has cycle_start/cycle_end. When a cycle ends, trainer creates a new plan (or duplicates and modifies). Old plan becomes archived. This keeps plan changes between cycles clean |
| **Flat measurement fields, not EAV** | Body measurements have a known, fixed schema (per the anthropometric protocol). Flat columns are simpler to query and chart than entity-attribute-value. Add columns if protocol changes |
| **Single exercises table, no per-client duplication** | Exercises are trainer-owned resources. Plans reference them. No need to duplicate exercise data per client |

## Patterns to Follow

### Pattern 1: Role-Based Route Guards

**What:** Single app with route-level access control, not two separate apps.
**When:** Always. The trainer and client portals share layout, auth, and many components.
**Why:** Two separate apps means duplicating shared code. One app with role-based routing is simpler.

```typescript
// Route structure
/login                    -- shared
/register                 -- client self-registration
/trainer/clients          -- trainer only
/trainer/exercises        -- trainer only
/trainer/plans/:clientId  -- trainer only
/trainer/progress/:clientId -- trainer only
/client/dashboard         -- client only
/client/plan              -- client only
/client/workout/:dayId    -- client only
/client/measurements      -- client only
/client/progress          -- client only
```

```typescript
// Middleware pattern (Next.js example)
function roleGuard(allowedRoles: string[]) {
  return (req, res, next) => {
    const user = getSessionUser(req);
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

### Pattern 2: Plan Versioning via Immutable Cycles

**What:** When a training cycle ends, the old plan is archived (immutable). A new plan is created for the next cycle. Workout logs reference the plan that was active when they were recorded.
**When:** Every plan transition.
**Why:** If you mutate plans in place, historical workout logs lose context. "Client did 3x10 at 60kg" means nothing if you later changed the prescription to 4x8 at 70kg.

```typescript
// Plan states
enum PlanStatus {
  DRAFT = 'draft',       // Trainer is building it
  ACTIVE = 'active',     // Client is using it
  ARCHIVED = 'archived'  // Cycle ended, read-only
}

// Only one plan per client can be ACTIVE at a time
// Workout logs always reference plan_exercise_id, which belongs to a specific plan
```

### Pattern 3: Aggregation Queries for Progress Charts

**What:** Progress data is computed on-read via SQL aggregation, not pre-computed.
**When:** At this scale (20-50 clients, months of data).
**Why:** With 50 clients x 5 days/week x 20 sets/day = ~5,000 sets/week. Even after a year, that is ~260,000 rows. PostgreSQL handles this trivially with proper indexes. Pre-computing adds complexity with no benefit at this scale.

```sql
-- Strength progress for one exercise over time
SELECT
  ws.date,
  MAX(wset.actual_weight) as max_weight,
  SUM(wset.actual_weight * wset.actual_reps) as total_volume
FROM workout_sessions ws
JOIN workout_sets wset ON wset.session_id = ws.id
JOIN plan_exercises pe ON wset.plan_exercise_id = pe.id
WHERE pe.exercise_id = :exerciseId
  AND ws.client_id = :clientId
ORDER BY ws.date;
```

### Pattern 4: i18n with Static Dictionaries

**What:** Translation strings stored as JSON dictionaries, loaded client-side based on user preference. Not a translation API.
**When:** For all user-facing text.
**Why:** Only two languages, known at build time. Static dictionaries are simpler and faster than runtime translation services. Measurement field labels, UI chrome, and system messages are all translatable. User-generated content (exercise names, plan names) is NOT translated -- the trainer writes those in whatever language they choose.

```typescript
// locales/es.json
{
  "dashboard.welcome": "Bienvenido, {{name}}",
  "workout.sets": "Series",
  "workout.reps": "Repeticiones",
  "workout.weight": "Peso (kg)",
  "progression.suggestion": "Has hecho 15+ reps. Considera subir +2.5kg"
}

// locales/en.json
{
  "dashboard.welcome": "Welcome, {{name}}",
  "workout.sets": "Sets",
  "workout.reps": "Reps",
  "workout.weight": "Weight (kg)",
  "progression.suggestion": "You hit 15+ reps. Consider adding +2.5kg"
}
```

### Pattern 5: YouTube Embed via iframe with Lazy Loading

**What:** Embed YouTube videos using the standard iframe embed URL. Lazy-load to avoid loading 10+ iframes when viewing a plan.
**When:** Exercise detail view, not list view.
**Why:** YouTube's embed API is stable and free. Lazy loading prevents performance issues when a plan day has many exercises. Show a thumbnail placeholder in the list, load the iframe only when the client taps an exercise.

```typescript
// Only load iframe when exercise detail is opened
function ExerciseVideo({ youtubeUrl }: { youtubeUrl: string }) {
  const videoId = extractYouTubeId(youtubeUrl);
  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}`}
      loading="lazy"
      allowFullScreen
      className="w-full aspect-video rounded-lg"
    />
  );
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Separate Apps for Trainer and Client

**What:** Building two entirely separate frontend applications.
**Why bad:** Massive code duplication (auth, layout, charts, exercise components). Two deployments to maintain. Shared components drift apart over time.
**Instead:** Single application with role-based routing and conditional rendering. Shared component library used by both portals.

### Anti-Pattern 2: NoSQL for This Data Model

**What:** Using MongoDB or similar document store for workout/measurement data.
**Why bad:** This data is highly relational (users -> plans -> days -> exercises -> sets). Time-series queries for charts need efficient aggregation. Document stores make joins painful and aggregation slower.
**Instead:** PostgreSQL. The data model is textbook relational. Indexes on (client_id, date) and (exercise_id, date) cover all chart queries.

### Anti-Pattern 3: Mutating Active Plans

**What:** Allowing the trainer to edit a plan while a client is mid-cycle.
**Why bad:** Client sees different exercises mid-week. Historical workout logs reference exercises that no longer exist in the plan. Progress tracking breaks.
**Instead:** Plans are immutable once active. Changes go into a draft for the next cycle. If an urgent change is needed, the trainer explicitly ends the current cycle and starts a new one.

### Anti-Pattern 4: Entity-Attribute-Value for Measurements

**What:** Storing measurements as `(client_id, date, measurement_type, value)` rows instead of flat columns.
**Why bad:** Every chart query requires pivoting. The measurement schema is fixed and known (the anthropometric protocol). EAV adds complexity for flexibility you do not need.
**Instead:** Flat table with one column per measurement. If the protocol adds a new site, add a column. This happens rarely (years, not weeks).

### Anti-Pattern 5: Real-Time/WebSocket Over-Engineering

**What:** Adding WebSocket connections for live updates.
**Why bad:** There are no real-time features. Trainer and client are never looking at the same screen simultaneously in a way that requires live updates. WebSockets add deployment complexity (sticky sessions, connection management).
**Instead:** Standard request/response. If a trainer wants to see updated progress, they refresh. Stale-while-revalidate caching pattern in the frontend handles freshness.

## Suggested Build Order

The build order is driven by data dependencies. You cannot log workouts without exercises and plans. You cannot show progress without workout logs.

```
Phase 1: Foundation
  Auth + User Management + Database Schema + i18n Setup
  ↓ (everything depends on auth and data layer)

Phase 2: Exercise Library
  CRUD exercises (trainer), display exercises (client)
  ↓ (plans depend on exercises existing)

Phase 3: Training Plans
  Plan builder (trainer), plan viewer (client)
  ↓ (workout logging depends on plans existing)

Phase 4: Workout Logging
  Per-set logging UI (client), session history
  ↓ (progress charts depend on logged data)

Phase 5: Body Measurements
  Measurement form (client), measurement history
  (can be built in parallel with Phase 4, no dependency)
  ↓ (progress charts depend on measurement data)

Phase 6: Progress and Analytics
  Line charts for strength, line charts for measurements,
  auto-progression suggestions, trainer dashboard
```

### Dependency Graph

```
Auth ─────────────────────────────────────────┐
  │                                            │
  ▼                                            ▼
Exercise Library                         i18n Setup
  │                                       (parallel)
  ▼
Training Plans
  │
  ├──────────────────┐
  ▼                  ▼
Workout Logging    Body Measurements
  │                  │    (parallel)
  └────────┬─────────┘
           ▼
  Progress Charts + Auto-Progression
```

### Why This Order

1. **Auth first** because every API endpoint needs it. Role-based access is the foundation.
2. **Exercise Library second** because it is a simple CRUD with no dependencies beyond auth. It also provides test data for plan building.
3. **Training Plans third** because this is the most complex feature (nested data: plan -> days -> exercises with prescribed values). It depends on exercises existing.
4. **Workout Logging fourth** because it depends on plans. This is the core client interaction loop.
5. **Body Measurements can parallel workout logging** since it has no dependency on plans or exercises -- just auth and the client.
6. **Progress Charts last** because they consume data from workout logs and measurements. Building them last means there is real data to display.

## Scalability Considerations

| Concern | At 20 clients | At 50 clients | At 500 clients (future) |
|---------|---------------|---------------|------------------------|
| **Database load** | Trivial. Single PostgreSQL handles everything | Still trivial. ~500K rows/year in workout_sets | Add read replicas for chart queries. Consider materialized views for heavy aggregations |
| **API throughput** | Single Node.js process is plenty | Same | Horizontal scaling with load balancer |
| **Frontend bundle** | Single bundle, no code splitting needed | Same | Code-split trainer/client portals for faster client load |
| **Chart rendering** | Client-side rendering, all data in one query | Same. Maybe paginate to last 6 months by default | Server-side pre-aggregation, pagination required |
| **Auth complexity** | JWT with role claim, no session store needed | Same | Add refresh tokens, consider session store for revocation |
| **File storage** | None (YouTube links only) | Same | Same unless video hosting added |

**Bottom line:** At 20-50 clients, the simplest possible architecture works. A single server, single database, monolithic frontend. Do not over-engineer for scale that is 10x away.

## Sources

- Architecture patterns based on established web application design principles for CRUD-heavy, role-based applications
- Data modeling patterns follow standard relational database design for fitness/workout tracking domains
- YouTube embed patterns per YouTube IFrame API documentation (standard, stable API)
- i18n approach follows next-intl / react-i18next established patterns for static bilingual apps
- Confidence: MEDIUM -- patterns are well-established but no external sources were queried due to tool constraints during this research session
