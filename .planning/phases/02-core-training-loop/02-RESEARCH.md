# Phase 2: Core Training Loop - Research

**Researched:** 2026-02-23 (re-researched 2026-02-23)
**Domain:** Training plan builder, workout logging, plan versioning, trainer dashboard
**Confidence:** HIGH

## Summary

Phase 2 is the product's reason to exist. It covers three interconnected domains: (1) the trainer builds personalized training plans organized by training days with prescribed sets/reps/weight, (2) the client views their plan, watches exercise videos, starts workout sessions, and logs every set, and (3) the trainer monitors all clients through a dashboard with completion indicators. The critical architectural challenge is plan versioning -- edits must create new versions for the next training cycle while preserving historical workout data tied to the previous version.

The data model must be designed around immutability from the start. The established pattern is a "Slowly Changing Dimension" approach: each `training_plan` has a `version` number and a status (`draft`, `active`, `archived`). When the trainer edits a plan, the system creates a new plan version record. Workout sessions reference a specific `plan_version_id`, making them permanently linked to the prescription that was active when the workout was logged. This is simpler and more robust than event sourcing or temporal tables for this scale.

The mobile workout logging UX is the highest-risk UI surface. Clients log workouts at the gym between sets, with sweaty hands, on a phone in one hand. The interface must minimize taps per set (target: 3-4 max), use large touch targets (56px+), pre-fill from last session's actual values (falling back to prescribed values), and support a "complete as prescribed" one-tap action. React Hook Form's `useFieldArray` handles the nested dynamic form structure (exercises -> sets) with minimal re-renders. YouTube videos should use `react-lite-youtube-embed` instead of raw iframes to save ~500KB initial load per video.

**CRITICAL CORRECTION from prior research:** The prior Phase 2 research incorrectly referenced Next.js 15, Server Components, Server Actions, and `@supabase/ssr`. Phase 1 establishes a **Vite SPA** architecture (React 19 + Vite 7 + React Router v7 in library mode). All Phase 2 patterns must align with client-side SPA architecture using the Supabase JS client directly, TanStack Query for data fetching/caching, and client-side React Hook Form for form management. There are no Server Components or Server Actions in this architecture.

**Zod version update:** Zod 4 is now the default when installing `zod` from npm (as of July 2025). It is 6-14x faster than Zod 3, has 57% smaller bundle, and is fully supported by `@hookform/resolvers` v5+. New projects should use Zod 4 directly via `import { z } from "zod"`.

**Primary recommendation:** Build the data model with immutable plan versioning from day one using a version number + status pattern. Use React Hook Form `useFieldArray` for the plan builder's nested form with Zod 4 validation. Use `react-lite-youtube-embed` for exercise videos. Design the workout logging UI for one-thumb mobile operation with pre-filled values and large touch targets. Use TanStack Query with Supabase for all data fetching (no Server Actions -- this is a Vite SPA).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Workout logging flow: Pre-fill set values from **last session's actual values** (not prescribed values). Falls back to prescribed values if no prior session exists
- Trainer dashboard: Javier manages **20-50 clients** -- scrollable list with search bar for quick access
- Gym UX: App used with sweaty hands on a phone -- every UX choice should optimize for minimal taps and large touch targets

### Claude's Discretion
The user delegated these choices -- Claude has full flexibility during planning/implementation:

**Workout logging:**
- Exercise display: one at a time (focused) vs all visible (scrollable) -- pick based on mobile gym UX
- YouTube video access: behind a tap icon vs always-visible thumbnail -- pick for minimal distraction during logging
- Post-workout summary: show stats screen vs simple confirmation -- pick what adds value without being annoying

**Plan builder:**
- Exercise picker: searchable dropdown vs browse dialog -- pick based on library size and trainer speed
- Versioning UX: automatic draft on edit vs explicit "Create new version" button -- pick the safest and simplest flow
- Exercise reordering: up/down arrow buttons vs drag-and-drop -- pick for mobile-first v1 context
- Day label format: free text vs auto-letters with optional name -- pick for best plan organization

**Training day navigation:**
- Day layout: tabs vs cards -- pick based on typical number of training days (3-6)
- Next day suggestion: highlight suggested day vs always manual selection -- pick for convenience vs simplicity
- Session resume: detect incomplete session and resume vs always start fresh -- pick for gym usage patterns
- Workout history: simple date list vs calendar view -- pick the simplest useful approach

**Trainer dashboard:**
- Dashboard home: client list first vs summary overview + list -- pick for 20-50 client roster
- Client detail: tabbed view vs single scrollable page -- pick for mobile usability with plan, logs, and progress data
- Status colors: green/yellow/gray vs green/blue/gray vs other -- pick a clean scheme fitting the app design

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLAN-01 | Trainer can create a training plan for a specific client | Plan builder with React Hook Form `useFieldArray` for nested days/exercises; Supabase `training_plans` table with RLS; Architecture Pattern 1 (Plan Builder) |
| PLAN-02 | Trainer can organize a plan by training days (Day A, Day B, etc.) | Nested `useFieldArray` for days within a plan; `training_days` table with `day_label` and `order` columns; Architecture Pattern 1 |
| PLAN-03 | Trainer can add exercises to a training day with prescribed sets, reps, and weight | Second-level nested `useFieldArray` for exercises within days; `plan_exercises` table; Zod 4 validation for numeric fields; Architecture Pattern 1 |
| PLAN-04 | Client can view their assigned training plan grouped by training day | TanStack Query for data fetching; Supabase RLS ensures client sees only their own plan; grouped display component |
| PLAN-05 | Trainer can define training cycle length per client | `cycle_length_weeks` column on `training_plans` table; cycle start/end date computation with date-fns |
| PLAN-06 | Plans are versioned -- editing creates new version for next cycle, preserving history | Architecture Pattern 2 (Immutable Plan Versioning); version number + status pattern; workout logs reference specific plan version |
| WLOG-01 | Client can start a workout session for a training day | `workout_sessions` table with `started_at` timestamp; references `training_day_id` and `plan_version_id` for immutability |
| WLOG-02 | Client can log weight and reps for each set of each exercise | `workout_sets` table; React Hook Form with `useFieldArray`; pre-filled from last session actual values; inputmode="decimal" for mobile; Architecture Pattern 3 (Gym-Floor Logging) |
| WLOG-03 | Workout session tracks start and completion time | `started_at` and `completed_at` columns on `workout_sessions`; computed duration display |
| WLOG-04 | Client can view workout history (past sessions with logged sets) | TanStack Query for paginated fetching; grouped by session date; Supabase query joining sessions with sets |
| EXER-03 | Client can view exercise with inline YouTube video embed from workout view | `react-lite-youtube-embed` v3.5.0 for performance; thumbnail-first loading; extract video ID from stored YouTube URL |
| DASH-01 | Trainer can view list of all clients with activity status | shadcn/ui Table component; Supabase RPC function with LATERAL JOINs for efficient status aggregation; RLS policy for trainer role |
| DASH-02 | Trainer sees color-coded indicators for today's workout completion | Computed via Supabase RPC function (not real-time); color logic: green=completed, yellow=in-progress, gray=not started |
| DASH-03 | Trainer can select a client to view their plan, logs, and progress | Client detail page with tabbed navigation (shadcn/ui Tabs); TanStack Query for lazy-loaded data per tab |
</phase_requirements>

## Standard Stack

### Core (from Phase 1 foundation -- already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.x | UI library | Latest stable; production-ready; universal ecosystem support |
| Vite | 7.x | Build tool / dev server | 40x faster than CRA; native ES modules; standard for new React projects |
| TypeScript | 5.x | Type safety | Type inference from Supabase schema and Zod schemas |
| @supabase/supabase-js | 2.97.x | Database, Auth, API | PostgreSQL with RLS for role-based data isolation |
| React Router | 7.x | Client-side routing | Library mode for SPA; role-based route guards |
| @tanstack/react-query | 5.90.x | Server state management | Caching, optimistic updates for workout logging, background refetch |
| Tailwind CSS | 4.x | Utility-first CSS | Mobile-first responsive design, large touch targets |
| shadcn/ui | Latest (CLI) | Component library | Table, Tabs, Form, Dialog, Card, Badge components |
| react-i18next | 16.x | i18n | Spanish/English translation for all Phase 2 UI strings |
| lucide-react | 0.575.x | Icons | Status indicators, navigation, action buttons |

### New for Phase 2
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | 7.71.x | Form state management | `useFieldArray` for dynamic nested forms (plan builder + workout logging) |
| zod | 4.3.x (Zod 4) | Schema validation | Shared validation for plan and workout forms; 6-14x faster than Zod 3 |
| @hookform/resolvers | 5.2.x | RHF + Zod integration | `zodResolver` connects Zod 4 schemas to React Hook Form |
| react-lite-youtube-embed | 3.5.x | Lightweight YouTube embed | Exercise video display in workout view; saves ~500KB vs raw iframe per video |
| date-fns | 4.1.x | Date manipulation | Training cycle date calculations, session timestamps, duration formatting |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-lite-youtube-embed | Raw iframe | Raw iframe adds ~500KB and dozens of network requests per embed before user clicks play; lite embed loads only a thumbnail initially |
| react-lite-youtube-embed | react-youtube | react-youtube wraps the full YouTube IFrame API (460KB+); overkill when we only need basic playback, no programmatic control |
| Supabase Realtime for dashboard | Polling or load-on-demand | Realtime adds WebSocket complexity; for a trainer checking a dashboard a few times per day with 20-50 clients, load-on-demand with TanStack Query stale-while-revalidate is simpler and sufficient |
| Custom drag-and-drop plan builder | Form-based plan builder | Drag-and-drop (e.g., dnd-kit) adds significant complexity for marginal UX gain; a form-based builder with add/remove/reorder buttons is faster to build and easier to use on mobile |
| Zod 3 | Zod 4 | Zod 4 is now the npm default; 6-14x faster parsing, 57% smaller bundle, better TS compilation (25k -> 175 type instantiations); @hookform/resolvers v5+ supports it natively |
| React Hook Form v8 (beta) | React Hook Form v7 (stable) | v8 is in beta only; v7.71.x is the latest stable; do not use beta for production |

**Installation (new packages only):**
```bash
pnpm add react-hook-form zod @hookform/resolvers react-lite-youtube-embed date-fns
```

**Note:** `zod` now exports Zod 4 by default. Import as `import { z } from "zod"`. No subpath needed for new projects.

## Architecture Patterns

### Recommended Project Structure (Phase 2 additions)
```
src/
├── features/
│   ├── plans/
│   │   ├── components/
│   │   │   ├── plan-form.tsx                 # Main plan builder form with useFieldArray
│   │   │   ├── training-day-card.tsx         # Single training day with exercises
│   │   │   ├── exercise-row.tsx              # Exercise prescription (sets/reps/weight)
│   │   │   └── exercise-picker-dialog.tsx    # Dialog to select from exercise library
│   │   ├── hooks/
│   │   │   ├── usePlans.ts                   # TanStack Query hooks for plan data
│   │   │   └── usePlanMutations.ts           # Mutations for plan CRUD and versioning
│   │   ├── schemas.ts                        # Zod 4 schemas for training plans
│   │   └── types.ts                          # Plan-related TypeScript types
│   ├── workouts/
│   │   ├── components/
│   │   │   ├── workout-session.tsx           # Active workout session container
│   │   │   ├── exercise-logger.tsx           # Per-exercise set logging interface
│   │   │   ├── set-row.tsx                   # Single set input (weight + reps)
│   │   │   ├── youtube-player.tsx            # react-lite-youtube-embed wrapper
│   │   │   └── session-summary.tsx           # Post-workout summary
│   │   ├── hooks/
│   │   │   ├── useWorkouts.ts               # TanStack Query hooks for workout data
│   │   │   └── useWorkoutMutations.ts        # Mutations for session and set logging
│   │   ├── schemas.ts                        # Zod 4 schemas for workout logging
│   │   └── types.ts                          # Workout-related TypeScript types
│   └── dashboard/
│       ├── components/
│       │   ├── client-list-table.tsx         # Trainer's client table with status
│       │   ├── client-status-badge.tsx       # Color-coded activity indicator
│       │   └── client-detail-tabs.tsx        # Tabbed view of client data
│       ├── hooks/
│       │   └── useDashboard.ts              # TanStack Query hooks for dashboard data
│       └── types.ts                          # Dashboard-related types
├── pages/
│   ├── trainer/
│   │   ├── clients.tsx                       # DASH-01: Client list with status
│   │   ├── client-detail.tsx                 # DASH-03: Client detail (plan, logs, progress)
│   │   ├── plan-view.tsx                     # PLAN-01: View/manage client plan
│   │   └── plan-edit.tsx                     # PLAN-01-03: Plan builder form
│   └── client/
│       ├── my-plan.tsx                       # PLAN-04: View my plan by day
│       ├── workout.tsx                       # WLOG-01-03: Active workout logging
│       └── workout-history.tsx               # WLOG-04: Workout history
├── lib/
│   └── utils/
│       ├── youtube.ts                        # YouTube URL parsing, video ID extraction
│       └── cycle.ts                          # Training cycle date calculations
```

### Pattern 1: Plan Builder with Nested useFieldArray

**What:** A form-based training plan builder where the trainer creates a plan with multiple training days, each containing multiple exercises with prescribed sets, reps, and weight. Uses React Hook Form's `useFieldArray` at two nesting levels.

**When to use:** PLAN-01, PLAN-02, PLAN-03

**Example:**
```typescript
// Source: React Hook Form docs (react-hook-form.com/docs/usefieldarray)
// Adapted for Vite SPA training plan builder with Zod 4

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const exerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  order: z.number().int().min(0),
  prescribed_sets: z.number().int().min(1).max(10),
  prescribed_reps: z.number().int().min(1).max(100),
  prescribed_weight_kg: z.number().min(0).max(500),
})

const trainingDaySchema = z.object({
  day_label: z.string().min(1).max(50), // "Day A", "Push Day", etc.
  order: z.number().int().min(0),
  exercises: z.array(exerciseSchema).min(1),
})

const planSchema = z.object({
  client_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  cycle_length_weeks: z.number().int().min(1).max(52),
  training_days: z.array(trainingDaySchema).min(1),
})

type PlanFormValues = z.infer<typeof planSchema>

function PlanBuilderForm({ clientId }: { clientId: string }) {
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      client_id: clientId,
      name: "",
      cycle_length_weeks: 4,
      training_days: [{ day_label: "Day A", order: 0, exercises: [] }],
    },
  })

  // Top-level field array: training days
  const { fields: dayFields, append: appendDay, remove: removeDay } =
    useFieldArray({ control: form.control, name: "training_days" })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {dayFields.map((dayField, dayIndex) => (
        <TrainingDayCard
          key={dayField.id}  // CRITICAL: use field.id, not array index
          control={form.control}
          dayIndex={dayIndex}
          onRemove={() => removeDay(dayIndex)}
        />
      ))}
      <button type="button" onClick={() => appendDay({
        day_label: `Day ${String.fromCharCode(65 + dayFields.length)}`,
        order: dayFields.length,
        exercises: [],
      })}>
        Add Training Day
      </button>
    </form>
  )
}

// Nested field array: exercises within a training day
function TrainingDayCard({ control, dayIndex, onRemove }) {
  const { fields: exerciseFields, append, remove, move } = useFieldArray({
    control,
    // TypeScript cast required for nested field arrays
    name: `training_days.${dayIndex}.exercises` as `training_days.0.exercises`,
  })

  return (
    <div>
      {exerciseFields.map((exField, exIndex) => (
        <ExerciseRow
          key={exField.id}
          control={control}
          dayIndex={dayIndex}
          exerciseIndex={exIndex}
          onRemove={() => remove(exIndex)}
          onMoveUp={() => exIndex > 0 && move(exIndex, exIndex - 1)}
          onMoveDown={() => exIndex < exerciseFields.length - 1 && move(exIndex, exIndex + 1)}
        />
      ))}
      <button type="button" onClick={() => append({
        exercise_id: "",
        order: exerciseFields.length,
        prescribed_sets: 3,
        prescribed_reps: 10,
        prescribed_weight_kg: 0,
      })}>
        Add Exercise
      </button>
    </div>
  )
}
```

**React 19 gotcha:** Use `useWatch()` instead of `watch()` to observe field values in React 19. The `watch()` API has known re-render issues with React 19 where components stop re-rendering when form values change. `useFieldArray` fields are unaffected by this issue.

### Pattern 2: Immutable Plan Versioning (Slowly Changing Dimension)

**What:** Training plans use a version number + status pattern. When a trainer edits an active plan, the system creates a new plan record (new version) with status `draft`. The old version stays `active` until the trainer explicitly activates the new version (starting a new cycle). Workout sessions always reference a specific `plan_id` (which represents a specific version), preserving the exact prescription at the time of the workout.

**When to use:** PLAN-05, PLAN-06

**Data model:**
```sql
-- Each row is ONE VERSION of a plan for one client
-- Editing a plan creates a NEW row, not an UPDATE
CREATE TABLE training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES profiles(id) NOT NULL,
  plan_group_id UUID NOT NULL,         -- Groups versions together (same plan lineage)
  version INT NOT NULL DEFAULT 1,       -- 1, 2, 3... increments per edit
  name TEXT NOT NULL,
  cycle_length_weeks INT NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'draft'  -- 'draft', 'active', 'archived'
    CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,             -- When this version became active
  archived_at TIMESTAMPTZ               -- When this version was archived
);

-- CONSTRAINT: Only one active plan per client at a time
CREATE UNIQUE INDEX idx_one_active_plan_per_client
  ON training_plans (client_id) WHERE status = 'active';

-- Training days belong to a specific plan version
CREATE TABLE training_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES training_plans(id) NOT NULL,
  day_label TEXT NOT NULL,              -- "Day A", "Push", etc.
  day_order INT NOT NULL,
  UNIQUE(plan_id, day_order)
);

-- Exercises prescribed within a training day (specific to a plan version)
CREATE TABLE plan_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_day_id UUID REFERENCES training_days(id) NOT NULL,
  exercise_id UUID REFERENCES exercises(id) NOT NULL,
  exercise_order INT NOT NULL,
  prescribed_sets INT NOT NULL,
  prescribed_reps INT NOT NULL,
  prescribed_weight_kg DECIMAL(6,2) NOT NULL,
  UNIQUE(training_day_id, exercise_order)
);

-- Workout sessions reference a specific training day (which belongs to a specific plan version)
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES profiles(id) NOT NULL,
  training_day_id UUID REFERENCES training_days(id) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Individual set logs reference a specific plan_exercise (preserving exact prescription)
CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) NOT NULL,
  plan_exercise_id UUID REFERENCES plan_exercises(id) NOT NULL,
  set_number INT NOT NULL,
  weight_kg DECIMAL(6,2) NOT NULL,
  reps INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, plan_exercise_id, set_number)
);

-- Performance indexes for RLS and common queries
CREATE INDEX idx_training_plans_client_status ON training_plans(client_id, status);
CREATE INDEX idx_training_days_plan_id ON training_days(plan_id);
CREATE INDEX idx_plan_exercises_day_id ON plan_exercises(training_day_id);
CREATE INDEX idx_workout_sessions_client_id ON workout_sessions(client_id);
CREATE INDEX idx_workout_sessions_day_id ON workout_sessions(training_day_id);
CREATE INDEX idx_workout_sessions_started_at ON workout_sessions(started_at);
CREATE INDEX idx_workout_sets_session_id ON workout_sets(session_id);
```

**Versioning workflow:**
```
1. Trainer creates plan v1 (status='draft')
2. Trainer activates plan v1 (status='active')
3. Client works out against v1 -- sessions reference training_days in v1
4. Trainer wants to change the plan:
   a. System deep-copies v1 -> creates v2 (status='draft')
   b. Trainer edits v2 (days, exercises, prescriptions)
   c. Trainer activates v2:
      - v1 status -> 'archived' (with archived_at timestamp)
      - v2 status -> 'active' (with activated_at timestamp)
5. Client now sees v2; all past sessions still reference v1 data (immutable)
```

**Deep copy function (Supabase RPC):**
```sql
-- Server-side function to create a new plan version
CREATE OR REPLACE FUNCTION create_plan_version(source_plan_id UUID)
RETURNS UUID AS $$
DECLARE
  new_plan_id UUID;
  source_plan training_plans%ROWTYPE;
  day_record RECORD;
  new_day_id UUID;
BEGIN
  -- Get source plan
  SELECT * INTO source_plan FROM training_plans WHERE id = source_plan_id;

  -- Create new plan version
  INSERT INTO training_plans (client_id, plan_group_id, version, name, cycle_length_weeks, status)
  VALUES (
    source_plan.client_id,
    source_plan.plan_group_id,
    source_plan.version + 1,
    source_plan.name,
    source_plan.cycle_length_weeks,
    'draft'
  ) RETURNING id INTO new_plan_id;

  -- Copy training days and their exercises
  FOR day_record IN SELECT * FROM training_days WHERE plan_id = source_plan_id ORDER BY day_order
  LOOP
    INSERT INTO training_days (plan_id, day_label, day_order)
    VALUES (new_plan_id, day_record.day_label, day_record.day_order)
    RETURNING id INTO new_day_id;

    INSERT INTO plan_exercises (training_day_id, exercise_id, exercise_order,
                                prescribed_sets, prescribed_reps, prescribed_weight_kg)
    SELECT new_day_id, exercise_id, exercise_order,
           prescribed_sets, prescribed_reps, prescribed_weight_kg
    FROM plan_exercises WHERE training_day_id = day_record.id
    ORDER BY exercise_order;
  END LOOP;

  RETURN new_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Pattern 3: Gym-Floor Workout Logging UI

**What:** A mobile-optimized workout logging interface designed for one-thumb operation at the gym. Pre-fills from last session's actual values (locked decision), uses large touch targets, and minimizes taps to log each set.

**When to use:** WLOG-01, WLOG-02, WLOG-03

**Key UX principles:**
- Large touch targets: minimum 48px, primary actions 56px+
- Pre-fill each set row with last session's actual values (falls back to prescribed if no history)
- "Complete as prescribed" one-tap button per set
- Number input with stepper buttons (+/- 2.5kg, +/- 1 rep) instead of free-text input
- `inputMode="decimal"` for mobile keyboard when user taps the value directly
- Show one exercise at a time (accordion or stepper), not the entire workout
- Session auto-starts when client opens the workout page
- "Finish Workout" button sets `completed_at` timestamp

**Example:**
```typescript
// Workout set logging with pre-filled values and stepper controls
// For use in a Vite SPA with React Hook Form

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Check, Save } from "lucide-react"

interface SetRowProps {
  setNumber: number
  prescribedWeight: number
  prescribedReps: number
  lastSessionWeight: number | null  // Actual value from last session
  lastSessionReps: number | null    // Actual value from last session
  onLog: (data: { set_number: number; weight_kg: number; reps: number }) => void
}

function SetRow({
  setNumber,
  prescribedWeight,
  prescribedReps,
  lastSessionWeight,
  lastSessionReps,
  onLog,
}: SetRowProps) {
  // Pre-fill priority: last session actual > prescribed (locked decision)
  const [weight, setWeight] = useState(lastSessionWeight ?? prescribedWeight)
  const [reps, setReps] = useState(lastSessionReps ?? prescribedReps)
  const [logged, setLogged] = useState(false)

  const handleLog = () => {
    onLog({ set_number: setNumber, weight_kg: weight, reps })
    setLogged(true)
  }

  return (
    <div className="flex items-center gap-3 py-3 min-h-[56px]">
      <span className="w-8 text-center font-bold text-muted-foreground">
        {setNumber}
      </span>

      {/* Weight with stepper */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-lg"
          onClick={() => setWeight(w => Math.max(0, w - 2.5))}
        >
          -
        </button>
        <input
          type="text"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(parseDecimalInput(e.target.value))}
          className="w-16 h-12 text-center text-lg font-semibold rounded-lg border"
        />
        <button
          type="button"
          className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-lg"
          onClick={() => setWeight(w => w + 2.5)}
        >
          +
        </button>
      </div>

      {/* Reps with stepper */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-lg"
          onClick={() => setReps(r => Math.max(0, r - 1))}
        >
          -
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={reps}
          onChange={(e) => setReps(parseInt(e.target.value) || 0)}
          className="w-12 h-12 text-center text-lg font-semibold rounded-lg border"
        />
        <button
          type="button"
          className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-lg"
          onClick={() => setReps(r => r + 1)}
        >
          +
        </button>
      </div>

      {/* Log button */}
      <button
        type="button"
        onClick={handleLog}
        disabled={logged}
        className={cn(
          "h-12 w-12 rounded-lg flex items-center justify-center",
          logged
            ? "bg-green-500 text-white"
            : "bg-primary text-primary-foreground"
        )}
      >
        {logged ? <Check /> : <Save />}
      </button>
    </div>
  )
}

// Parse decimal input accepting both comma and period (INFR-03)
function parseDecimalInput(value: string): number {
  const normalized = value.replace(",", ".")
  const parsed = parseFloat(normalized)
  return isNaN(parsed) ? 0 : parsed
}
```

### Pattern 4: YouTube Lite Embed for Exercise Videos

**What:** Use `react-lite-youtube-embed` v3.5.x instead of raw iframes to display exercise demonstration videos. Shows a lightweight thumbnail placeholder initially, loading the full YouTube player only when the user clicks play.

**When to use:** EXER-03

**Example:**
```typescript
// Source: react-lite-youtube-embed (github.com/ibrahimcesar/react-lite-youtube-embed)
import LiteYouTubeEmbed from "react-lite-youtube-embed"
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css"

function ExerciseVideo({ youtubeUrl, exerciseName }: {
  youtubeUrl: string
  exerciseName: string
}) {
  const videoId = extractYouTubeVideoId(youtubeUrl)

  if (!videoId) return null

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden">
      <LiteYouTubeEmbed
        id={videoId}
        title={exerciseName}
        poster="hqdefault"    // Thumbnail quality
        noCookie={true}       // Use youtube-nocookie.com for privacy
      />
    </div>
  )
}

// Robust YouTube URL parser -- handles 4+ URL formats users may paste
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}
```

### Pattern 5: RLS Policies for Trainer/Client Data Isolation

**What:** Row Level Security policies that enforce: clients see only their own plans, sessions, and sets; trainer (single role) sees all client data. Uses `(select auth.uid())` and `(select auth.jwt()->>'user_role')` wrapped in SELECT for RLS performance optimization.

**When to use:** All Phase 2 tables

**Critical RLS performance rule:** Always wrap `auth.uid()` and `auth.jwt()` calls in a SELECT subquery: `(select auth.uid())` instead of bare `auth.uid()`. This enables PostgreSQL's initPlan optimization to cache the result per-statement rather than calling per-row. Supabase docs confirm this can improve performance from 179ms to 9ms.

**Example:**
```sql
-- Source: Supabase RLS docs (supabase.com/docs/guides/database/postgres/row-level-security)
-- + Supabase RLS performance best practices

-- Enable RLS on all Phase 2 tables
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is trainer (wraps JWT read in SELECT for caching)
-- Use a security definer function to avoid RLS on the profiles join
CREATE OR REPLACE FUNCTION is_trainer()
RETURNS BOOLEAN AS $$
  SELECT (select auth.jwt()->>'user_role') = 'trainer'
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- TRAINING PLANS: Client sees own plans; Trainer sees all
CREATE POLICY "Clients view own plans"
  ON training_plans FOR SELECT TO authenticated
  USING (
    client_id = (SELECT auth.uid())
  );

CREATE POLICY "Trainer views all plans"
  ON training_plans FOR SELECT TO authenticated
  USING (is_trainer());

CREATE POLICY "Trainer inserts plans"
  ON training_plans FOR INSERT TO authenticated
  WITH CHECK (is_trainer());

CREATE POLICY "Trainer updates plans"
  ON training_plans FOR UPDATE TO authenticated
  USING (is_trainer())
  WITH CHECK (is_trainer());

-- TRAINING DAYS: Access through plan ownership
CREATE POLICY "Clients view own training days"
  ON training_days FOR SELECT TO authenticated
  USING (
    plan_id IN (
      SELECT id FROM training_plans WHERE client_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Trainer manages training days"
  ON training_days FOR ALL TO authenticated
  USING (is_trainer())
  WITH CHECK (is_trainer());

-- PLAN EXERCISES: Access through training day -> plan ownership
CREATE POLICY "Clients view own plan exercises"
  ON plan_exercises FOR SELECT TO authenticated
  USING (
    training_day_id IN (
      SELECT td.id FROM training_days td
      JOIN training_plans tp ON td.plan_id = tp.id
      WHERE tp.client_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Trainer manages plan exercises"
  ON plan_exercises FOR ALL TO authenticated
  USING (is_trainer())
  WITH CHECK (is_trainer());

-- WORKOUT SESSIONS: Client creates/views own; Trainer views all
CREATE POLICY "Clients manage own sessions"
  ON workout_sessions FOR ALL TO authenticated
  USING (client_id = (SELECT auth.uid()))
  WITH CHECK (client_id = (SELECT auth.uid()));

CREATE POLICY "Trainer views all sessions"
  ON workout_sessions FOR SELECT TO authenticated
  USING (is_trainer());

-- WORKOUT SETS: Access through session ownership
CREATE POLICY "Clients manage own sets"
  ON workout_sets FOR ALL TO authenticated
  USING (
    session_id IN (
      SELECT id FROM workout_sessions WHERE client_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM workout_sessions WHERE client_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Trainer views all sets"
  ON workout_sets FOR SELECT TO authenticated
  USING (is_trainer());
```

### Pattern 6: Dashboard Client Status Query

**What:** A single efficient Supabase RPC function that loads the trainer's client list with today's workout completion status, avoiding N+1 queries.

**When to use:** DASH-01, DASH-02

**Example:**
```sql
-- Supabase RPC function for trainer dashboard
CREATE OR REPLACE FUNCTION get_client_dashboard()
RETURNS TABLE (
  client_id UUID,
  full_name TEXT,
  email TEXT,
  status TEXT,                    -- 'active', 'inactive', 'pending'
  has_active_plan BOOLEAN,
  today_workout_status TEXT,      -- 'completed', 'in_progress', 'not_started', null
  last_workout_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS client_id,
    p.full_name,
    p.email,
    CASE
      WHEN p.is_active = false THEN 'pending'
      WHEN ws_recent.last_workout IS NULL THEN 'inactive'
      WHEN ws_recent.last_workout < now() - INTERVAL '7 days' THEN 'inactive'
      ELSE 'active'
    END AS status,
    (tp.id IS NOT NULL) AS has_active_plan,
    CASE
      WHEN ws_today.completed_at IS NOT NULL THEN 'completed'
      WHEN ws_today.id IS NOT NULL THEN 'in_progress'
      ELSE 'not_started'
    END AS today_workout_status,
    ws_recent.last_workout AS last_workout_at
  FROM profiles p
  LEFT JOIN training_plans tp ON tp.client_id = p.id AND tp.status = 'active'
  LEFT JOIN LATERAL (
    SELECT MAX(ws.started_at) AS last_workout
    FROM workout_sessions ws
    WHERE ws.client_id = p.id
  ) ws_recent ON TRUE
  LEFT JOIN LATERAL (
    SELECT ws.id, ws.completed_at
    FROM workout_sessions ws
    WHERE ws.client_id = p.id
      AND ws.started_at::DATE = CURRENT_DATE
    ORDER BY ws.started_at DESC
    LIMIT 1
  ) ws_today ON TRUE
  WHERE p.role = 'client'::user_role
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Calling from client (Vite SPA):**
```typescript
// src/features/dashboard/hooks/useDashboard.ts
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useClientDashboard() {
  return useQuery({
    queryKey: ["dashboard", "clients"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_client_dashboard")
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes -- trainer doesn't need real-time
  })
}
```

### Pattern 7: Pre-fill from Last Session (Locked Decision)

**What:** When a client starts a workout, each set row is pre-filled with values from the last completed session for the same training day and exercise. Falls back to prescribed values if no prior session exists.

**When to use:** WLOG-01, WLOG-02

**Example query:**
```typescript
// Fetch last session's actual values for pre-filling workout
async function getLastSessionValues(
  clientId: string,
  trainingDayId: string
): Promise<Map<string, { weight_kg: number; reps: number }[]>> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(`
      workout_sets (
        plan_exercise_id,
        set_number,
        weight_kg,
        reps
      )
    `)
    .eq("client_id", clientId)
    .eq("training_day_id", trainingDayId)
    .not("completed_at", "is", null)  // Only completed sessions
    .order("started_at", { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return new Map()

  // Group sets by plan_exercise_id
  const grouped = new Map<string, { weight_kg: number; reps: number }[]>()
  for (const set of data.workout_sets) {
    const existing = grouped.get(set.plan_exercise_id) || []
    existing.push({ weight_kg: set.weight_kg, reps: set.reps })
    grouped.set(set.plan_exercise_id, existing)
  }

  // Sort each exercise's sets by set_number
  for (const [key, sets] of grouped) {
    grouped.set(key, sets.sort((a, b) => a.set_number - b.set_number))
  }

  return grouped
}
```

### Anti-Patterns to Avoid

- **Mutating active plans:** NEVER update `training_days` or `plan_exercises` on a plan with status='active'. Always create a new version. The unique constraint on `(client_id) WHERE status = 'active'` prevents accidental double-activation.
- **Storing YouTube URLs as-is for display:** Always extract and validate the video ID (11 chars) on input. Parse URLs at storage time. This prevents URL format inconsistencies and simplifies thumbnail generation.
- **Fetching all workout history at once:** Use date-range-bounded queries with pagination. Default to last 30 days for history views.
- **Using Supabase Realtime for dashboard:** Adds WebSocket complexity for a dashboard viewed a few times per day. Use standard queries with TanStack Query's `staleTime` and `refetchOnWindowFocus`.
- **Drag-and-drop for plan builder on v1:** Form-based add/remove/reorder is faster to build, works better on mobile, and covers 100% of the use case. Add DnD only if Javier specifically requests it.
- **Bare `auth.uid()` in RLS policies:** Always wrap in `(SELECT auth.uid())` for the initPlan performance optimization. Same for `auth.jwt()`.
- **Using `watch()` with React 19:** Use `useWatch()` instead. The `watch()` API has known re-render issues with React 19 where components stop updating when form values change.
- **Server Actions / Server Components:** This is a Vite SPA, NOT Next.js. All data mutations go through Supabase JS client + TanStack Query mutations. There are no Server Actions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Nested dynamic forms | Custom state management for plan builder arrays | React Hook Form `useFieldArray` (nested) | Handles add/remove/reorder/validate with minimal re-renders; manual state for 3-level nesting is bug-prone |
| YouTube video embedding | Custom iframe with thumbnail detection and lazy loading | `react-lite-youtube-embed` v3.5.x | Handles thumbnail loading, click-to-play, privacy mode (nocookie), responsive sizing; 500KB savings per video vs raw iframe |
| YouTube URL parsing | Simple regex for one URL format | Multi-pattern parser (see Pattern 4) | YouTube has 4+ URL formats (watch, youtu.be, embed, /v/); users paste any format |
| Decimal input parsing (locale-aware) | Assume period-only decimal separator | Parser accepting both comma and period (see `parseDecimalInput`) | Spanish locale uses comma; English uses period; requirement INFR-03 mandates both |
| Plan deep-copy for versioning | Manual INSERT statements per table in application code | Supabase RPC function (see Pattern 2) | Server-side function is atomic (no partial copies), faster (no round trips), and simpler to test |
| Client status computation | Multiple queries per client to compute dashboard status | Single SQL function with LATERAL JOINs (see Pattern 6) | Avoids N+1 queries; computes status, today's workout, and last activity in one pass |
| Role-based data isolation | Application-level `if (role === 'trainer')` checks | Supabase RLS policies | Database-level enforcement cannot be bypassed by frontend bugs; policies are the security boundary |
| Form validation | Custom validation logic scattered across components | Zod 4 schemas shared between form and API layer | Single source of truth for validation rules; type inference; 6-14x faster than Zod 3 |
| Date calculations | Manual date arithmetic | date-fns v4.1.x | Cycle length computation, session duration, "last 30 days" ranges; handles DST and timezone edge cases |

**Key insight:** The plan builder and workout logger are nested data structures with complex state. React Hook Form's `useFieldArray` is purpose-built for exactly this shape. Hand-rolling state management for "plan -> days -> exercises" or "session -> exercises -> sets" creates a maintenance nightmare of array manipulation, validation synchronization, and re-render management.

## Common Pitfalls

### Pitfall 1: Plan Mutation Destroying Historical Context
**What goes wrong:** Trainer edits an active plan by modifying rows in `training_days` and `plan_exercises` directly. Workout sessions logged last week now reference exercises with different prescribed values, corrupting historical data.
**Why it happens:** The natural CRUD instinct is to UPDATE the existing record. Immutability is not the default mental model.
**How to avoid:** Enforce immutability at the database level. Use the version + status pattern (Pattern 2). Create a new plan version via the `create_plan_version` RPC function. Add a database trigger or constraint that prevents UPDATE on `plan_exercises` belonging to plans with status='active' or 'archived'.
**Warning signs:** If the code has any `UPDATE plan_exercises SET ... WHERE training_day_id IN (SELECT id FROM training_days WHERE plan_id = <active_plan_id>)`, the model is broken.

### Pitfall 2: N+1 Queries on Trainer Dashboard
**What goes wrong:** The client list page fetches all clients, then for each client makes separate queries for their active plan, last workout, and today's workout status. With 50 clients, this is 150+ queries on page load.
**Why it happens:** Fetching is done per-component without thinking about the aggregated query pattern.
**How to avoid:** Use the dashboard RPC function (Pattern 6) that computes all status in a single query with LATERAL JOINs. The frontend calls one endpoint and receives all the data it needs.
**Warning signs:** Network tab shows 50+ Supabase requests on the dashboard page.

### Pitfall 3: Workout Logging Too Many Taps on Mobile
**What goes wrong:** Each set requires: tap weight input, open keyboard, type weight, close keyboard, tap reps input, open keyboard, type reps, close keyboard, tap save. That is 8+ interactions per set, times 3-5 sets, times 5+ exercises = 120+ interactions per workout.
**Why it happens:** Developer builds a standard form and tests on desktop.
**How to avoid:** Pre-fill with last session's actual values (locked decision). Add stepper buttons (+/- 2.5kg, +/- 1 rep) so the user adjusts rather than types from scratch. Add "complete as prescribed" one-tap action. Use `inputMode="decimal"` for weight and `inputMode="numeric"` for reps so the correct keyboard appears when tapping directly. Target: 1-3 taps per set when hitting prescribed values.
**Warning signs:** Count taps from opening a workout to logging all sets. If total exceeds 3 * (total sets), iterate.

### Pitfall 4: Training Day Display Not Matching Client Mental Model
**What goes wrong:** Plan shows a flat list of all exercises across all days. Client cannot quickly find "today's workout."
**Why it happens:** Data is fetched flat from the database and displayed without grouping.
**How to avoid:** Always group by training day. Show day tabs or cards at the top level. Client taps their day (e.g., "Day A - Push") and sees only that day's exercises. The app should remember or suggest which day is next based on workout history.
**Warning signs:** Client complains they "cannot find their workout" or takes more than 5 seconds to start logging.

### Pitfall 5: Cycle Transition Without Clear UX
**What goes wrong:** Trainer creates a new plan version but the client still sees the old version. Or the trainer archives the old plan and the client sees "no plan assigned" for a period.
**Why it happens:** The activation workflow is unclear or has race conditions between archiving old and activating new.
**How to avoid:** Make activation atomic: the `activate_plan_version` function archives the current active plan AND activates the new one in a single transaction. Add a confirmation dialog: "Activate this plan for [Client Name]? Their current plan will be archived." Show the client a clear message during transitions.
**Warning signs:** Client sees "no plan" when they should have one. Trainer has to ask "can you see the new plan?"

### Pitfall 6: Not Pre-fetching Exercise Data for Workout Session
**What goes wrong:** When a client starts a workout, each exercise card makes a separate request to fetch exercise details (name, video URL). The workout view loads slowly as exercises trickle in.
**Why it happens:** Data is fetched per-component instead of in a single query for the entire training day.
**How to avoid:** Fetch the complete training day data in one query: join `training_days` -> `plan_exercises` -> `exercises` to get all exercise names, video IDs, and prescriptions in a single request. Use TanStack Query to cache this aggressively since plan data rarely changes mid-cycle.
**Warning signs:** Workout page shows loading spinners per exercise instead of loading all at once.

### Pitfall 7: Using watch() Instead of useWatch() in React 19
**What goes wrong:** Form components stop re-rendering when form values change. The UI appears frozen or shows stale values.
**Why it happens:** React Hook Form's `watch()` API has a known incompatibility with React 19's rendering behavior. Components that rely on `watch()` to observe form values may not re-render when those values change.
**How to avoid:** Use `useWatch()` hook instead of `watch()` throughout the application. `useWatch()` isolates re-rendering at the hook level and works correctly with React 19.
**Warning signs:** Form fields not updating visually when other fields change, especially in dependent field scenarios.

### Pitfall 8: RLS Performance with Nested Table Access
**What goes wrong:** RLS policies on `workout_sets` that join through `workout_sessions` to check `client_id` run slowly because the join triggers RLS on the joined table too.
**Why it happens:** PostgreSQL applies RLS policies to joined tables unless bypassed with SECURITY DEFINER functions.
**How to avoid:** Use `IN (SELECT ...)` subqueries rather than JOINs in RLS policies. For complex chains, create SECURITY DEFINER helper functions. Always wrap `auth.uid()` and `auth.jwt()` in `(SELECT ...)` for initPlan optimization. Index all columns referenced in RLS policies.
**Warning signs:** Slow queries on `workout_sets` despite small data volumes. Check with `EXPLAIN ANALYZE`.

## Code Examples

Verified patterns from official sources:

### TanStack Query Optimistic Update for Set Logging
```typescript
// Source: TanStack Query docs (tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
// Adapted for Vite SPA workout set logging

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

function useLogSet(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newSet: {
      plan_exercise_id: string
      set_number: number
      weight_kg: number
      reps: number
    }) => {
      const { data, error } = await supabase
        .from("workout_sets")
        .insert({ session_id: sessionId, ...newSet })
        .select()
        .single()

      if (error) throw error
      return data
    },

    // Optimistic update: show the set as logged immediately
    onMutate: async (newSet) => {
      await queryClient.cancelQueries({
        queryKey: ["workout-sets", sessionId]
      })

      const previousSets = queryClient.getQueryData(
        ["workout-sets", sessionId]
      )

      queryClient.setQueryData(
        ["workout-sets", sessionId],
        (old: any[]) => [...(old || []), { ...newSet, id: "temp-" + Date.now() }]
      )

      return { previousSets }
    },

    // Rollback on error
    onError: (_err, _newSet, context) => {
      queryClient.setQueryData(
        ["workout-sets", sessionId],
        context?.previousSets
      )
    },

    // Refetch to ensure server state is canonical
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["workout-sets", sessionId]
      })
    },
  })
}
```

### Supabase Query for Client's Active Plan with Exercises
```typescript
// Fetch the complete active plan for a client in one query
// Used in Vite SPA via TanStack Query
import { supabase } from "@/lib/supabase"

async function getActiveTrainingPlan(clientId: string) {
  const { data, error } = await supabase
    .from("training_plans")
    .select(`
      id,
      name,
      version,
      cycle_length_weeks,
      activated_at,
      training_days (
        id,
        day_label,
        day_order,
        plan_exercises (
          id,
          exercise_order,
          prescribed_sets,
          prescribed_reps,
          prescribed_weight_kg,
          exercises (
            id,
            name,
            youtube_url
          )
        )
      )
    `)
    .eq("client_id", clientId)
    .eq("status", "active")
    .single()

  if (error) throw error

  // Sort days and exercises by order
  data.training_days.sort((a, b) => a.day_order - b.day_order)
  data.training_days.forEach(day => {
    day.plan_exercises.sort((a, b) => a.exercise_order - b.exercise_order)
  })

  return data
}
```

### Workout Session Start and Complete (Vite SPA)
```typescript
// Workout session management via Supabase client
// No Server Actions -- this is a Vite SPA

import { supabase } from "@/lib/supabase"

export async function startWorkoutSession(trainingDayId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      client_id: user.id,
      training_day_id: trainingDayId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function completeWorkoutSession(sessionId: string) {
  const { data, error } = await supabase
    .from("workout_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}
```

### Plan Activation (Atomic Version Transition)
```sql
-- Atomic plan activation: archives current, activates new
CREATE OR REPLACE FUNCTION activate_plan_version(new_plan_id UUID)
RETURNS VOID AS $$
DECLARE
  target_client_id UUID;
BEGIN
  -- Get the client this plan belongs to
  SELECT client_id INTO target_client_id
  FROM training_plans WHERE id = new_plan_id;

  -- Archive current active plan (if any)
  UPDATE training_plans
  SET status = 'archived', archived_at = now()
  WHERE client_id = target_client_id AND status = 'active';

  -- Activate the new plan
  UPDATE training_plans
  SET status = 'active', activated_at = now()
  WHERE id = new_plan_id AND status = 'draft';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### TanStack Query Key Factory Pattern
```typescript
// src/features/plans/hooks/usePlans.ts
// Consistent query key structure for cache management

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export const planKeys = {
  all: ["plans"] as const,
  lists: () => [...planKeys.all, "list"] as const,
  list: (clientId: string) => [...planKeys.all, "list", clientId] as const,
  details: () => [...planKeys.all, "detail"] as const,
  detail: (planId: string) => [...planKeys.all, "detail", planId] as const,
  active: (clientId: string) => [...planKeys.all, "active", clientId] as const,
}

export const workoutKeys = {
  all: ["workouts"] as const,
  sessions: (clientId: string) => [...workoutKeys.all, "sessions", clientId] as const,
  session: (sessionId: string) => [...workoutKeys.all, "session", sessionId] as const,
  sets: (sessionId: string) => [...workoutKeys.all, "sets", sessionId] as const,
  lastSession: (clientId: string, dayId: string) =>
    [...workoutKeys.all, "last", clientId, dayId] as const,
  history: (clientId: string) => [...workoutKeys.all, "history", clientId] as const,
}

export const dashboardKeys = {
  all: ["dashboard"] as const,
  clients: () => [...dashboardKeys.all, "clients"] as const,
  clientDetail: (clientId: string) => [...dashboardKeys.all, "client", clientId] as const,
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw YouTube iframe embed | Lite YouTube embed (thumbnail-first) | 2020+ (Paul Irish, lite-youtube-embed) | ~500KB savings per video, better Core Web Vitals, better mobile performance |
| Redux for form state | React Hook Form with useFieldArray | 2020+ (RHF v7) | Minimal re-renders, built-in array manipulation, works with Zod |
| Custom real-time polling | TanStack Query staleTime + refetchOnWindowFocus | 2022+ (React Query v4/v5) | Automatic background sync without WebSocket complexity |
| Mutable plans with audit logs | Immutable plan versions (SCD pattern) | Established pattern | Historical data integrity guaranteed by data model, not application code |
| Application-level auth checks | Database-level RLS policies | Supabase mainstream adoption 2022+ | Security enforced at data layer, cannot be bypassed by frontend bugs |
| Zod 3 (z.object, z.string().email()) | Zod 4 (z.object, z.email() as top-level) | July 2025 (Zod 4.0.0) | 6-14x faster parsing, 57% smaller bundle, 10x faster TS compilation |
| @hookform/resolvers v3 (Zod 3 only) | @hookform/resolvers v5 (Zod 3 + Zod 4) | 2025 | Auto-detects Zod version; supports both v3 and v4 |
| RHF watch() for reactive fields | RHF useWatch() for React 19 | 2024-2025 (React 19 release) | watch() has re-render issues in React 19; useWatch() isolates re-renders correctly |
| date-fns v3 (separate tz package) | date-fns v4 (built-in timezone support) | 2024-2025 | First-class timezone support via TZDate and tz helper; no separate @date-fns/tz needed |
| Bare auth.uid() in RLS | (SELECT auth.uid()) wrapped | Supabase best practices 2024+ | initPlan caching optimization: 179ms -> 9ms per query |

**Deprecated/outdated:**
- **react-youtube** (npm): Full YouTube IFrame API wrapper. Overkill for simple embed/playback. Use `react-lite-youtube-embed` unless programmatic player control is needed.
- **Formik**: Higher re-render overhead compared to React Hook Form for forms with frequent updates (like rapid set logging). RHF is the current standard.
- **Event sourcing for plan versioning at this scale**: Massive over-engineering. SCD (version + status columns) achieves the same result with standard SQL.
- **Zod 3 for new projects**: Zod 4 is now the default on npm. New projects should use `import { z } from "zod"` which gives Zod 4. Zod 3 available at `"zod/v3"` for legacy code.
- **Next.js / Server Components for this app**: Phase 1 research correctly chose Vite SPA for this scale (single trainer, 20-50 clients). No SSR needed. Do not introduce Next.js.
- **`z.string().email()` in Zod 4**: Use `z.email()` as a top-level validator instead. `.email()` method on strings is deprecated in Zod 4.
- **`.strict()` and `.passthrough()` in Zod 4**: Use `z.strictObject()` and `z.looseObject()` functions instead.
- **`.merge()` in Zod 4**: Use `.extend()` instead.

## Open Questions

1. **Cycle length enforcement -- auto or manual?**
   - What we know: The trainer defines `cycle_length_weeks` per client. Plans are versioned.
   - What's unclear: Does the system automatically suggest a cycle transition when the duration expires, or does the trainer manually manage all transitions? The simpler approach (manual with a visual indicator "Cycle ends in 3 days") is recommended for v1.
   - Recommendation: Show a visual indicator on the trainer dashboard when a client's cycle is nearing its end. Do not auto-transition. Trainer clicks "Start New Cycle" manually.

2. **Which training day to show the client by default**
   - What we know: Client has multiple training days (Day A, B, C, etc.).
   - What's unclear: Should the app suggest the next day based on the last completed workout? Or does the client always choose manually?
   - Recommendation: Show all days with the "next" day highlighted (based on the day after the last completed workout session). Client can still pick any day. This is a simple query: "last workout session's training_day -> next day in order."

3. **Workout session resume behavior**
   - What we know: A session has started_at and completed_at.
   - What's unclear: If a client closes the browser mid-workout, should the session be resumable? Or do they start a new session?
   - Recommendation: If an incomplete session exists for today (started_at is today, completed_at is null), resume it. Show previously logged sets and allow continuing.

## Sources

### Primary (HIGH confidence)
- [React Hook Form useFieldArray docs](https://react-hook-form.com/docs/usefieldarray) - Nested field array API, rules, and patterns
- [React Hook Form useWatch docs](https://react-hook-form.com/docs/usewatch) - Reactive form value observation for React 19
- [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security) - Policy creation, auth.uid(), role-based patterns
- [Supabase RLS performance best practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) - initPlan caching, SELECT wrapping, security definer functions
- [Supabase RPC docs](https://supabase.com/docs/reference/javascript/rpc) - Calling PostgreSQL functions from client
- [TanStack Query optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates) - onMutate/onError/onSettled pattern
- [Zod 4 release notes](https://zod.dev/v4) - Performance improvements, API changes, bundle size
- [Zod 4 migration guide](https://zod.dev/v4/changelog) - Breaking changes from Zod 3 to Zod 4
- [Zod 4 versioning](https://zod.dev/v4/versioning) - Import paths, npm distribution model
- npm registry verified versions: react-hook-form 7.71.2, zod 4.3.6, @hookform/resolvers 5.2.2, react-lite-youtube-embed 3.5.0, date-fns 4.1.0, @tanstack/react-query 5.90.21, lucide-react 0.575.0, @supabase/supabase-js 2.97.0

### Secondary (MEDIUM confidence)
- [react-lite-youtube-embed GitHub](https://github.com/ibrahimcesar/react-lite-youtube-embed) - v3.5.0, peer dep React >=18.2.0 (React 19 compatible), ~500KB savings confirmed by multiple sources
- [React Hook Form React 19 compatibility discussion](https://github.com/orgs/react-hook-form/discussions/11832) - Known watch() issue, useWatch() workaround
- [The Invisible Form Bug: React 19 + React Hook Form](https://www.buildwithmatija.com/blog/the-invisible-form-bug-react-19-react-hook-form-s-hidden-compatibility-issue) - Detailed analysis of watch() re-render issue
- [Zod 4 + @hookform/resolvers compatibility issue](https://github.com/colinhacks/zod/issues/4992) - Confirmed working with @hookform/resolvers v5+
- [Supabase RLS using Security Definers](https://blog.entrostat.com/supabase-rls-functions/) - Pattern for SECURITY DEFINER helper functions
- [date-fns v4 announcement](https://blog.date-fns.org/v40-with-time-zone-support/) - First-class timezone support, minimal breaking changes

### Tertiary (LOW confidence)
- React Hook Form v8 beta status - In beta only; do not use for production; v7.71.x is latest stable
- Mobile workout UX patterns from open-source fitness apps on GitHub - Patterns vary widely, principles are consistent

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via npm with exact versions; Phase 1 foundation confirmed as Vite SPA (NOT Next.js)
- Architecture (plan versioning): HIGH - SCD pattern is a well-established database pattern; PostgreSQL constraints enforce it; tested with Supabase RLS
- Architecture (plan builder UI): HIGH - React Hook Form useFieldArray is specifically designed for this pattern; verified in official docs; React 19 compatibility confirmed with useWatch() workaround
- Architecture (workout logging UX): MEDIUM - UX principles are well-established (large touch targets, pre-fill, steppers) but specific implementation needs real-device testing
- Pitfalls: HIGH - All pitfalls verified against official docs; React 19 watch() issue confirmed by multiple sources; RLS performance patterns from official Supabase docs
- Dashboard patterns: MEDIUM - SQL query approach is standard but exact query optimization depends on Phase 1 schema decisions
- Zod 4 integration: HIGH - Confirmed working with @hookform/resolvers v5+; migration path documented; import path verified

**Key corrections from prior research:**
1. **Architecture:** Changed from Next.js 15 (App Router, Server Components, Server Actions) to Vite SPA (React 19, React Router v7, TanStack Query + Supabase client). This aligns with Phase 1 decisions.
2. **Zod version:** Changed from Zod ^3.x to Zod 4.3.x. Zod 4 is now the npm default (since July 2025).
3. **@hookform/resolvers:** Changed from ^3.x to 5.2.x (supports Zod 4 natively).
4. **date-fns:** Changed from ^3.x to 4.1.x (v4 adds built-in timezone support).
5. **react-lite-youtube-embed:** Updated from ^2.4+ to 3.5.x (current version).
6. **RLS patterns:** Added `(SELECT auth.uid())` wrapping and SECURITY DEFINER helper function for performance optimization.
7. **React 19 pitfall:** Added useWatch() vs watch() compatibility issue.
8. **Added user constraints section** (required by format, was missing).

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (30 days -- stable domain, no fast-moving dependencies)
