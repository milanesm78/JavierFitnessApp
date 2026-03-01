---
phase: 04-auto-progression
plan: 01
subsystem: database
tags: [supabase, postgresql, rls, rpc, tanstack-query, typescript, progression, auto-progression]

# Dependency graph
requires:
  - phase: 02-core-training-loop
    provides: workout_sessions, workout_sets, plan_exercises tables, is_trainer() helper, workoutKeys/planKeys query factories
provides:
  - progression_suggestions table with pending/accepted/dismissed lifecycle
  - check_progression_eligibility RPC with warm-up filtering and 3-session cooldown
  - accept_progression_suggestion RPC with stale check and atomic weight update
  - dismiss_progression_suggestion RPC with FOR UPDATE locking
  - progressionKeys query key factory and 4 TanStack Query hooks
  - useCompleteSession integration triggering detection after session completion
  - exercises.progression_increment_kg column for per-exercise increments
affects: [04-02, progression-ui, client-workout-summary, trainer-client-detail]

# Tech tracking
tech-stack:
  added: []
  patterns: [fire-and-forget-rpc-in-onSuccess, progression-suggestion-lifecycle, per-exercise-increment-coalesce, stale-suggestion-auto-dismiss, cooldown-by-session-count]

key-files:
  created: [supabase/migrations/00005_progression_suggestions.sql, src/features/progression/types.ts, src/features/progression/hooks/useProgression.ts]
  modified: [src/types/database.ts, src/features/workouts/hooks/useWorkoutMutations.ts]

key-decisions:
  - "SECURITY INVOKER for all 3 RPC functions (not DEFINER) so RLS applies to the calling user's context"
  - "Fire-and-forget pattern for progression detection in useCompleteSession to avoid blocking session completion UX"
  - "Stale suggestion auto-dismiss on accept when prescribed weight has changed (prevents weight reduction bugs)"
  - "3-session cooldown for re-suggestion after dismissal, counted by completed sessions after dismissal date"
  - "Per-exercise increment via COALESCE(progression_increment_kg, 2.5) -- NULL defaults to 2.5kg standard increment"
  - "Warm-up filter: only evaluate sets where weight_kg >= prescribed_weight_kg"

patterns-established:
  - "Pattern: progressionKeys query key factory follows workoutKeys/planKeys convention from Phase 2"
  - "Pattern: Fire-and-forget RPC call in onSuccess with .then()/.catch() for non-critical side effects"
  - "Pattern: FOR UPDATE row locking in accept/dismiss RPCs for safe concurrent access"
  - "Pattern: Partial index WHERE status = 'pending' for fast pending suggestion lookup"

requirements-completed: [PROG-01, PROG-02]

# Metrics
duration: 6min
completed: 2026-02-28
---

# Phase 4 Plan 1: Progression Data Layer Summary

**Progression suggestions table with 3 PostgreSQL RPCs (detect/accept/dismiss), warm-up filtering, stale check, 3-session cooldown, and TanStack Query hooks integrated into session completion flow**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-28T23:26:32Z
- **Completed:** 2026-02-28T23:32:32Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- SQL migration with progression_suggestions table, progression_status enum, 3 RLS policies, partial index, and per-exercise increment column
- 3 RPC functions: check_progression_eligibility (detection with warm-up filter + cooldown), accept_progression_suggestion (atomic weight update with stale check), dismiss_progression_suggestion (with FOR UPDATE locking)
- 4 TanStack Query hooks (useCheckProgression, usePendingSuggestions, useAcceptSuggestion, useDismissSuggestion) with query key factory
- useCompleteSession modified to fire-and-forget progression detection after session completion
- Database types updated with progression_suggestions table, 3 RPC function signatures, and exercises.progression_increment_kg

## Task Commits

Each task was committed atomically:

1. **Task 1: Create progression SQL migration with table, RPC functions, and RLS policies** - `235c74c` (feat)
2. **Task 2: Create progression types, TanStack Query hooks, and integrate detection into session completion** - `fba16d7` (feat)

## Files Created/Modified
- `supabase/migrations/00005_progression_suggestions.sql` - Complete progression schema (table, 3 RPCs, 3 RLS policies, partial index, exercises ALTER TABLE)
- `src/features/progression/types.ts` - ProgressionSuggestion, ProgressionStatus, ProgressionSuggestionWithExercise types
- `src/features/progression/hooks/useProgression.ts` - progressionKeys factory, useCheckProgression, usePendingSuggestions, useAcceptSuggestion, useDismissSuggestion
- `src/types/database.ts` - Updated Database type with progression_suggestions table, 3 RPC function signatures, exercises.progression_increment_kg
- `src/features/workouts/hooks/useWorkoutMutations.ts` - Added fire-and-forget progression detection in useCompleteSession onSuccess

## Decisions Made
- Used SECURITY INVOKER for all 3 RPC functions so RLS applies in the calling user's context (client can only insert own suggestions)
- Fire-and-forget pattern for progression detection to avoid blocking the session completion toast and navigation
- Stale suggestion auto-dismiss prevents weight reduction when trainer has already manually increased weight
- 3-session cooldown counts completed sessions after dismissal date, not calendar time
- Per-exercise increment column defaults to NULL (COALESCE to 2.5kg) -- trainer can optionally configure per exercise
- Warm-up filter uses >= (not =) so sets slightly above prescribed weight also qualify

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**The SQL migration must be applied to the Supabase database.**
1. Open Supabase Dashboard -> SQL Editor
2. Paste and run `supabase/migrations/00005_progression_suggestions.sql`
3. Verify: progression_suggestions table created, exercises table has progression_increment_kg column
4. Verify: 3 RPC functions created (check_progression_eligibility, accept_progression_suggestion, dismiss_progression_suggestion)

## Next Phase Readiness
- Progression data layer complete, ready for UI implementation (Plan 04-02)
- UI plan can use usePendingSuggestions for client post-workout summary
- UI plan can use useAcceptSuggestion/useDismissSuggestion for confirm/dismiss actions
- Trainer client detail view can show pending suggestions via same hooks
- SQL migration ready to be applied in Supabase SQL Editor

## Self-Check: PASSED

- All 5 key files exist (migration, types, hooks, database types, workout mutations)
- Both task commits verified (235c74c, fba16d7)
- TypeScript compiles with zero errors

---
*Phase: 04-auto-progression*
*Completed: 2026-02-28*
