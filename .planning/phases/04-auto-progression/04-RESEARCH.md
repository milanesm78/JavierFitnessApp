# Phase 4: Auto-Progression - Research

**Researched:** 2026-02-23
**Domain:** Progressive overload detection, suggestion lifecycle management, confirmation UX
**Confidence:** HIGH

## Summary

Phase 4 is a narrow, well-scoped feature: detect when a client logs 15+ reps on an exercise, create a weight increase suggestion (+2.5kg), and present it for confirmation before applying. This is fundamentally a **detection query + suggestion record + confirmation UI** problem, not an AI or machine learning problem. The entire feature can be built with a PostgreSQL database function triggered after workout log insertion, a `progression_suggestions` table to track suggestion lifecycle, and a simple inline Alert component in the workout logging UI.

The architecture decision with the most impact is **where** the detection logic runs. A PostgreSQL trigger-based approach (AFTER INSERT on workout_logs) keeps the logic atomic and impossible to bypass -- every logged set is evaluated regardless of which client or code path inserts it. The alternative (application-side detection in the Server Action that saves workout logs) is simpler to debug but risks divergence if workout logs are ever inserted through multiple paths. For this project's scale and single-developer context, **a Supabase database function called via RPC after workout completion** is the recommended middle ground: explicit, testable, and centralized without the hidden-logic drawback of triggers.

**Primary recommendation:** Use a Supabase RPC function to check progression eligibility after a workout session is completed, store suggestions in a `progression_suggestions` table with a simple status enum (pending/accepted/dismissed), and display them as an inline Alert banner in the workout view with confirm/dismiss actions.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROG-01 | App detects when client logs 15+ reps on an exercise and suggests +2.5kg for next session | Detection via Supabase RPC function `check_progression_eligibility` querying workout_logs for max reps per exercise in the completed session. Stores result in `progression_suggestions` table. |
| PROG-02 | Auto-progression is a suggestion -- client or trainer confirms before applying | Suggestion lifecycle managed by `progression_suggestions.status` enum (pending/accepted/dismissed). UI uses shadcn/ui Alert component with confirm/dismiss actions. Accepted suggestions update `plan_exercises.prescribed_weight_kg` for the next session. |
</phase_requirements>

## Standard Stack

### Core

No new libraries are required for Phase 4. The feature is built entirely with the existing stack established in earlier phases.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase (PostgreSQL) | Already installed | Detection query + suggestion storage | The progression detection is a SQL query against existing `workout_logs` data. PostgreSQL functions handle the logic server-side. No additional library needed. |
| TanStack Query | Already installed | Suggestion state management + cache invalidation | Fetching pending suggestions, invalidating after accept/dismiss. Standard pattern already used throughout the app. |
| shadcn/ui (Alert, AlertDialog) | Already installed | Suggestion presentation + confirmation | Alert component for inline suggestion banner, AlertDialog for confirmation modal if needed. Both already available in the project. |
| next-intl | Already installed | i18n for suggestion messages | Suggestion text ("You logged 15+ reps. Consider +2.5kg") must be bilingual (ES/EN). Uses existing i18n infrastructure. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | Already installed | Validate suggestion confirmation payload | When accepting a suggestion, validate the new weight value server-side before updating `plan_exercises`. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| RPC function for detection | PostgreSQL AFTER INSERT trigger on `workout_logs` | Triggers are invisible to application code, harder to debug, and create hidden coupling. RPC function is explicit and testable. Use trigger only if detection must happen on every single row insert regardless of application path. |
| Dedicated `progression_suggestions` table | Computed on-the-fly via query at read time | On-the-fly computation is simpler (no table) but means re-running the detection query every time the client opens a workout view. A table provides suggestion lifecycle tracking (accepted/dismissed) and prevents re-suggesting dismissed progressions. |
| shadcn/ui Alert (inline banner) | Toast notification | Toasts are ephemeral and auto-dismiss. A progression suggestion must persist on screen until explicitly acted upon. Alert is the correct component. |

**Installation:**
```bash
# No new packages needed. Ensure these shadcn/ui components are installed:
npx shadcn@latest add alert alert-dialog
```

## Architecture Patterns

### Recommended Project Structure

Phase 4 adds to the existing structure -- no new directories needed.

```
src/
├── app/
│   ├── [locale]/
│   │   ├── client/
│   │   │   └── workout/
│   │   │       └── [dayId]/
│   │   │           └── page.tsx          # Existing -- add suggestion banner here
│   │   └── trainer/
│   │       └── clients/
│   │           └── [clientId]/
│   │               └── page.tsx          # Existing -- show pending suggestions
├── components/
│   └── progression/
│       ├── progression-suggestion.tsx     # Alert banner component
│       └── progression-confirm-dialog.tsx # Confirmation dialog
├── lib/
│   └── queries/
│       └── progression.ts                # Supabase RPC calls + TanStack Query hooks
└── messages/
    ├── en.json                           # Add progression.* keys
    └── es.json                           # Add progression.* keys
```

### Pattern 1: Detection via Supabase RPC Function

**What:** A PostgreSQL function that checks whether any exercise in a completed workout session had a set with 15+ reps. Called explicitly after session completion.

**When to use:** After a client completes (or saves) a workout session.

**Why:** Keeps detection logic in SQL close to the data. The function runs within the same transaction context if needed. It is explicit -- the application code calls it, making it visible and debuggable.

**Example:**

```sql
-- Supabase migration: create progression detection function
CREATE OR REPLACE FUNCTION check_progression_eligibility(session_id UUID)
RETURNS SETOF progression_suggestions
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  log_record RECORD;
  existing_suggestion UUID;
BEGIN
  -- Find exercises in this session where any set had 15+ reps
  FOR log_record IN
    SELECT DISTINCT
      wl.plan_exercise_id,
      pe.exercise_id,
      pe.prescribed_weight_kg,
      ws.client_id
    FROM workout_logs wl
    JOIN workout_sessions ws ON ws.id = wl.session_id
    JOIN plan_exercises pe ON pe.id = wl.plan_exercise_id
    WHERE wl.session_id = check_progression_eligibility.session_id
      AND wl.reps >= 15
  LOOP
    -- Check if a pending suggestion already exists for this exercise + weight
    SELECT id INTO existing_suggestion
    FROM progression_suggestions
    WHERE client_id = log_record.client_id
      AND exercise_id = log_record.exercise_id
      AND current_weight_kg = log_record.prescribed_weight_kg
      AND status = 'pending';

    -- Only create suggestion if none exists
    IF existing_suggestion IS NULL THEN
      RETURN QUERY
      INSERT INTO progression_suggestions (
        client_id,
        exercise_id,
        plan_exercise_id,
        current_weight_kg,
        suggested_weight_kg,
        triggered_by_session_id,
        status
      ) VALUES (
        log_record.client_id,
        log_record.exercise_id,
        log_record.plan_exercise_id,
        log_record.prescribed_weight_kg,
        log_record.prescribed_weight_kg + 2.5,
        check_progression_eligibility.session_id,
        'pending'
      )
      RETURNING *;
    END IF;
  END LOOP;
END;
$$;
```

### Pattern 2: Suggestion Lifecycle (State Machine)

**What:** A `progression_suggestions` table with a simple three-state lifecycle: `pending` -> `accepted` or `dismissed`. No complex state machine library needed.

**When to use:** Every progression suggestion goes through this lifecycle.

**Example:**

```sql
-- Supabase migration: progression_suggestions table
CREATE TYPE progression_status AS ENUM ('pending', 'accepted', 'dismissed');

CREATE TABLE progression_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES profiles(id),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  plan_exercise_id UUID NOT NULL REFERENCES plan_exercises(id),
  current_weight_kg DECIMAL(6,2) NOT NULL,
  suggested_weight_kg DECIMAL(6,2) NOT NULL,
  triggered_by_session_id UUID NOT NULL REFERENCES workout_sessions(id),
  status progression_status NOT NULL DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup of pending suggestions per client
CREATE INDEX idx_progression_pending
  ON progression_suggestions(client_id, status)
  WHERE status = 'pending';

-- RLS policies
ALTER TABLE progression_suggestions ENABLE ROW LEVEL SECURITY;

-- Clients can see their own suggestions
CREATE POLICY "Clients view own suggestions"
  ON progression_suggestions FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer'
    )
  );

-- Only the system (via RPC) inserts suggestions
CREATE POLICY "System inserts suggestions"
  ON progression_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

-- Client or trainer can update (accept/dismiss)
CREATE POLICY "Client or trainer resolves suggestions"
  ON progression_suggestions FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'trainer'
    )
  )
  WITH CHECK (
    status IN ('accepted', 'dismissed')
  );
```

### Pattern 3: Accept Suggestion with Weight Update

**What:** When a suggestion is accepted, update both the suggestion status and the plan exercise prescribed weight in a single database function.

**Example:**

```sql
CREATE OR REPLACE FUNCTION accept_progression_suggestion(suggestion_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  suggestion RECORD;
BEGIN
  -- Get and lock the suggestion
  SELECT * INTO suggestion
  FROM progression_suggestions
  WHERE id = suggestion_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suggestion not found or already resolved';
  END IF;

  -- Update the plan exercise weight
  UPDATE plan_exercises
  SET prescribed_weight_kg = suggestion.suggested_weight_kg
  WHERE id = suggestion.plan_exercise_id;

  -- Mark suggestion as accepted
  UPDATE progression_suggestions
  SET status = 'accepted',
      resolved_at = now(),
      resolved_by = auth.uid()
  WHERE id = suggestion_id;
END;
$$;
```

### Pattern 4: Inline Suggestion Banner in Workout View

**What:** Display pending suggestions as a non-dismissable Alert banner within the exercise section of the workout view. The banner sits between the exercise header and the set logging area.

**Why inline (not toast/modal):** The suggestion is contextual to a specific exercise. It must persist until acted upon. A toast disappears. A modal interrupts the workout flow. An inline banner is visible but not blocking.

### Anti-Patterns to Avoid

- **Auto-applying weight increases without confirmation:** The requirement explicitly states suggestions must be confirmed. Never update `plan_exercises.prescribed_weight_kg` without explicit user action.
- **Re-triggering dismissed suggestions:** If a suggestion for "Bench Press at 60kg -> 62.5kg" is dismissed, do not re-create it the next time the client logs 15+ reps at the same weight. Track the exercise + weight combination in the suggestions table and check before inserting.
- **Complex ML/AI for a simple threshold rule:** The rule is "15+ reps -> suggest +2.5kg." This is a SQL WHERE clause, not a machine learning model. Do not overcomplicate this.
- **Evaluating progression mid-session (per set):** Do not show a suggestion banner after the client logs their first set of 15+ reps while they are still working through remaining sets. Evaluate after the session is completed (or at minimum, after the exercise is done).
- **Using a PostgreSQL trigger for the detection:** While technically cleaner for data integrity, triggers hide logic from the application layer and are harder to debug for a single-developer project. Use an explicit RPC call instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Suggestion lifecycle state | Custom state machine library | Simple `status` enum column + UPDATE queries | Three states (pending/accepted/dismissed) do not warrant a state machine library. An enum column with SQL constraints is sufficient. |
| Detecting 15+ reps across sets | Client-side JavaScript loops over fetched workout data | PostgreSQL function via Supabase RPC | The database already has the data. SQL is more efficient and authoritative than fetching all sets to the client and looping. |
| Atomic accept (update weight + mark accepted) | Two separate API calls (update suggestion + update plan_exercise) | Single PostgreSQL function `accept_progression_suggestion` | Two separate calls risk partial failure (suggestion marked accepted but weight not updated). A database function wraps both in a transaction. |
| Confirmation UI | Custom modal from scratch | shadcn/ui AlertDialog or Alert with action buttons | Already available in the project. Accessible, keyboard-navigable, and styled consistently. |

**Key insight:** Phase 4 adds zero new dependencies. The entire feature is SQL logic + existing React components. The complexity is in getting the detection query and suggestion lifecycle right, not in tooling.

## Common Pitfalls

### Pitfall 1: Evaluating the Wrong Sets

**What goes wrong:** The detection checks if *any single set* in a session hit 15+ reps. But the client might do set 1 at 15 reps (warm-up with lighter weight) and sets 2-4 at 8-10 reps with the prescribed weight. The suggestion fires based on the warm-up set, which is misleading.

**Why it happens:** The requirement says "logs 15+ reps on an exercise" which is ambiguous about which sets count.

**How to avoid:** The detection function should only evaluate sets logged against the *prescribed* plan exercise at the *prescribed weight*. If the client logged a set at a different weight (e.g., warm-up), that set should not trigger progression. The SQL query includes `AND wl.weight_kg = pe.prescribed_weight_kg` (or within a small tolerance like +/- 0.5kg to account for plate availability).

**Warning signs:** Suggestions appearing for exercises where the client clearly was not performing at the prescribed weight.

### Pitfall 2: Suggestions That Won't Go Away

**What goes wrong:** The client dismisses a suggestion, but the next time they log 15+ reps at the same weight, the suggestion re-appears. The client has to keep dismissing the same suggestion every session.

**Why it happens:** The detection function does not check for previously dismissed suggestions at the same exercise + weight combination.

**How to avoid:** Before inserting a new suggestion, check if a `dismissed` suggestion already exists for the same `(client_id, exercise_id, current_weight_kg)`. If so, do not create a new one. Only allow re-suggestion after the weight has actually changed (either manually by the trainer or through a different accepted suggestion).

**Warning signs:** Clients or Javier complaining about "annoying" repeat suggestions.

### Pitfall 3: Stale Suggestions After Plan Changes

**What goes wrong:** A suggestion says "increase Bench Press from 60kg to 62.5kg" but the trainer has already manually updated the plan to 65kg. The stale suggestion would reduce the weight if accepted.

**Why it happens:** Suggestions reference a `plan_exercise_id` and `current_weight_kg` at creation time. If the plan exercise weight changes independently, the suggestion becomes stale.

**How to avoid:** When accepting a suggestion, verify that `plan_exercises.prescribed_weight_kg` still matches `progression_suggestions.current_weight_kg`. If the weight has changed, auto-dismiss the suggestion instead of applying it. The `accept_progression_suggestion` function should include this check.

**Warning signs:** Accepted suggestions that result in a weight *decrease*.

### Pitfall 4: Missing i18n for Suggestion Messages

**What goes wrong:** Suggestion messages are hardcoded in English. Spanish-speaking clients see English text in an otherwise Spanish interface.

**Why it happens:** The progression feature is added late (Phase 4) and the developer forgets to add translation keys.

**How to avoid:** Add translation keys for all progression-related UI text in both `en.json` and `es.json` from the start of Phase 4 implementation. Key examples: suggestion banner text, confirm button label, dismiss button label, success toast after acceptance, stale suggestion warning.

**Warning signs:** Any hardcoded string in progression components that does not go through `useTranslations()`.

### Pitfall 5: Not Showing Suggestions to the Trainer

**What goes wrong:** Only the client sees progression suggestions. The trainer has no visibility into which clients have pending suggestions, making it impossible for them to proactively confirm or dismiss.

**Why it happens:** The requirement says "client or trainer confirms" but the developer only implements the client-side UI.

**How to avoid:** Include a "Pending Suggestions" section or indicator in the trainer's client detail view. The trainer should be able to see all pending suggestions for any client and accept/dismiss them from the trainer portal.

**Warning signs:** Javier asking "how do I see which clients should increase weight?"

## Code Examples

Verified patterns from official sources and project conventions:

### Calling the Detection RPC After Session Completion

```typescript
// Source: Supabase JS RPC docs + TanStack Query pattern from makerkit.dev
// lib/queries/progression.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Database } from '@/lib/database.types';

type Client = SupabaseClient<Database>;

// Check for progression after completing a workout session
export function useCheckProgression() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase
        .rpc('check_progression_eligibility', { session_id: sessionId });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, sessionId) => {
      // Invalidate suggestions query so the UI picks up new suggestions
      queryClient.invalidateQueries({
        queryKey: ['progression-suggestions'],
      });
    },
  });
}

// Fetch pending suggestions for the current client
export function usePendingSuggestions(clientId: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['progression-suggestions', clientId, 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progression_suggestions')
        .select(`
          *,
          exercise:exercises(name),
          plan_exercise:plan_exercises(prescribed_weight_kg)
        `)
        .eq('client_id', clientId)
        .eq('status', 'pending')
        .throwOnError();

      return data;
    },
  });
}

// Accept a suggestion
export function useAcceptSuggestion() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .rpc('accept_progression_suggestion', { suggestion_id: suggestionId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['progression-suggestions'],
      });
      // Also invalidate plan exercises since weight changed
      queryClient.invalidateQueries({
        queryKey: ['plan-exercises'],
      });
    },
  });
}

// Dismiss a suggestion
export function useDismissSuggestion() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from('progression_suggestions')
        .update({
          status: 'dismissed',
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', suggestionId)
        .throwOnError();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['progression-suggestions'],
      });
    },
  });
}
```

### Inline Suggestion Banner Component

```typescript
// Source: shadcn/ui Alert docs (ui.shadcn.com)
// components/progression/progression-suggestion.tsx

'use client';

import { TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAcceptSuggestion, useDismissSuggestion } from '@/lib/queries/progression';

interface ProgressionSuggestionProps {
  suggestion: {
    id: string;
    current_weight_kg: number;
    suggested_weight_kg: number;
    exercise: { name: string };
  };
}

export function ProgressionSuggestion({ suggestion }: ProgressionSuggestionProps) {
  const t = useTranslations('progression');
  const acceptMutation = useAcceptSuggestion();
  const dismissMutation = useDismissSuggestion();

  return (
    <Alert>
      <TrendingUp className="h-4 w-4" />
      <AlertTitle>{t('suggestion_title')}</AlertTitle>
      <AlertDescription>
        {t('suggestion_body', {
          exercise: suggestion.exercise.name,
          currentWeight: suggestion.current_weight_kg,
          suggestedWeight: suggestion.suggested_weight_kg,
        })}
      </AlertDescription>
      <AlertAction>
        <Button
          variant="outline"
          size="sm"
          onClick={() => dismissMutation.mutate(suggestion.id)}
          disabled={dismissMutation.isPending}
        >
          {t('dismiss')}
        </Button>
        <Button
          size="sm"
          onClick={() => acceptMutation.mutate(suggestion.id)}
          disabled={acceptMutation.isPending}
        >
          {t('accept')}
        </Button>
      </AlertAction>
    </Alert>
  );
}
```

### Translation Keys

```json
// messages/en.json (add to existing)
{
  "progression": {
    "suggestion_title": "Weight Increase Suggestion",
    "suggestion_body": "You logged 15+ reps on {exercise} at {currentWeight}kg. Consider increasing to {suggestedWeight}kg for your next session.",
    "accept": "Increase Weight",
    "dismiss": "Not Now",
    "accepted_toast": "Weight updated to {weight}kg for {exercise}",
    "stale_warning": "This suggestion is outdated -- the prescribed weight has already changed."
  }
}
```

```json
// messages/es.json (add to existing)
{
  "progression": {
    "suggestion_title": "Sugerencia de aumento de peso",
    "suggestion_body": "Has hecho 15+ reps en {exercise} con {currentWeight}kg. Considera aumentar a {suggestedWeight}kg en tu proxima sesion.",
    "accept": "Aumentar Peso",
    "dismiss": "Ahora no",
    "accepted_toast": "Peso actualizado a {weight}kg para {exercise}",
    "stale_warning": "Esta sugerencia esta desactualizada -- el peso prescrito ya ha cambiado."
  }
}
```

### Triggering Detection After Workout Completion

```typescript
// In the workout session completion handler (existing code in Phase 2)
// This is where the detection RPC gets called

async function handleCompleteSession(sessionId: string) {
  // 1. Mark session as completed (existing logic)
  await supabase
    .from('workout_sessions')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', sessionId);

  // 2. Check for progression eligibility (Phase 4 addition)
  await supabase.rpc('check_progression_eligibility', {
    session_id: sessionId,
  });

  // 3. Navigate to session summary or back to plan view
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual trainer review of all workout logs to spot progression opportunities | Rules-based detection with configurable thresholds (e.g., Alpha Progression, Fitbod) | 2023-2024 | Automates the tedious part (detection) while preserving trainer authority (confirmation). Javier's approach of a fixed 15-rep threshold with +2.5kg is a simple version of this pattern. |
| Automatic weight adjustments without confirmation | Suggestion-based with explicit confirmation | Current standard in coaching apps | Prevents unwanted changes, maintains trainer-client trust. All modern coaching platforms (TrueCoach, TrainHeroic) treat auto-progression as advisory, not mandatory. |
| Complex periodization algorithms for progression | Simple threshold rules for basic progressive overload | Always valid for coached training | Complex algorithms (DUP, block periodization) are appropriate for self-coached athletes. For trainer-managed clients, the trainer IS the intelligence -- the app just surfaces data. |

**Deprecated/outdated:**
- Automatic weight changes without user confirmation -- every modern coaching platform makes this opt-in
- Client-side-only progression detection (fetching all logs to JavaScript and computing) -- wasteful and slow at scale; use server-side SQL

## Open Questions

1. **Which sets count toward the 15-rep threshold?**
   - What we know: The requirement says "logs 15+ reps on an exercise." The research assumption is: any set at the prescribed weight for that exercise.
   - What's unclear: Does Javier mean ALL sets must hit 15+? Any single set? Only the last set? Across multiple sessions?
   - Recommendation: Default to "any single set at the prescribed weight" for v1. This is the simplest to implement and most generous (triggers suggestions more often). Javier can request stricter criteria after using it. The detection function can be easily updated in the SQL without changing the rest of the architecture.
   - **Blocker status:** Flagged in STATE.md. Must be clarified with Javier before implementation. The architecture supports any variant.

2. **Should suggestions persist across training cycles?**
   - What we know: Plans are versioned per cycle. When a new cycle starts, plan_exercise records change.
   - What's unclear: If a client has a pending suggestion from cycle N and the trainer starts cycle N+1 with a new plan, should the old suggestion be auto-dismissed?
   - Recommendation: Auto-dismiss all pending suggestions for a client when a new training cycle starts (or when the trainer creates a new plan version). The stale suggestion check in `accept_progression_suggestion` handles the interim case.

3. **Fixed +2.5kg or variable increment?**
   - What we know: The requirement specifies +2.5kg. STATE.md flags this as needing clarification.
   - What's unclear: Should some exercises progress differently (e.g., +5kg for deadlifts, +1.25kg for lateral raises)?
   - Recommendation: Hardcode +2.5kg for v1. If Javier wants per-exercise increments later, add an optional `progression_increment_kg` column to `exercises` and default to 2.5 when null. The architecture supports this extension without schema changes to `progression_suggestions`.

## Sources

### Primary (HIGH confidence)
- [Supabase Database Functions docs](https://supabase.com/docs/guides/database/functions) -- RPC function creation, calling from JS client, security invoker pattern
- [Supabase Triggers docs](https://supabase.com/docs/guides/database/postgres/triggers) -- Trigger syntax, AFTER INSERT pattern, NEW record variable
- [Supabase RPC JavaScript reference](https://supabase.com/docs/reference/javascript/rpc) -- `.rpc()` client syntax, parameters, return types
- [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security) -- `auth.uid()` pattern, INSERT WITH CHECK, SELECT USING
- [shadcn/ui Alert component](https://ui.shadcn.com/docs/components/radix/alert) -- Alert, AlertTitle, AlertDescription, AlertAction composition
- [shadcn/ui AlertDialog component](https://ui.shadcn.com/docs/components/radix/alert-dialog) -- Confirmation dialog pattern with AlertDialogAction/Cancel
- [PostgreSQL CREATE TRIGGER docs](https://www.postgresql.org/docs/current/sql-createtrigger.html) -- Trigger syntax, FOR EACH ROW, AFTER INSERT

### Secondary (MEDIUM confidence)
- [Supabase + TanStack Query integration guide (MakerKit, Jan 2026)](https://makerkit.dev/blog/saas/supabase-react-query) -- `.throwOnError()` pattern, mutation with invalidation, optimistic updates
- [Fitbod progressive overload approach](https://fitbod.me/blog/what-is-progressive-overload-and-how-fitbod-builds-it-into-every-workout-automatically/) -- Industry pattern for algorithm-driven weight progression in fitness apps
- [Alpha Progression app](https://alphaprogression.com/en) -- Example of auto-adjusted training recommendations based on performance data
- [Next.js Server Actions guide](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) -- Server-side mutation pattern, revalidation after data change
- [PostgreSQL triggers best practices (LinkedIn)](https://www.linkedin.com/pulse/triggers-sql-databases-extend-its-declarative-data-logic-pachot-szqfe) -- Data logic vs business logic distinction for trigger use

### Tertiary (LOW confidence)
- [Fitness app UX design patterns (Stormotion)](https://stormotion.io/blog/fitness-app-ux/) -- General UX principles for workout screens; "one action per screen" guidance
- [pgfsm PostgreSQL state machine](https://github.com/michelp/pgfsm) -- Reference for PostgreSQL-native state machines; validated that a simple enum is sufficient for 3-state lifecycle

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new libraries needed. All patterns use existing project dependencies (Supabase, TanStack Query, shadcn/ui, next-intl).
- Architecture: HIGH -- Detection via RPC function, suggestion table with enum status, inline Alert UI. All patterns verified against official Supabase and shadcn/ui documentation.
- Pitfalls: HIGH -- Pitfalls derived from project-specific research (PITFALLS.md Pitfall 6) and verified against fitness domain patterns. The "which sets count" ambiguity is flagged as an open question requiring Javier's input.

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (stable -- no fast-moving dependencies)
