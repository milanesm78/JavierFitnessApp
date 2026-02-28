---
status: resolved
trigger: "exercise-names-not-loading-in-edit: When editing a workout/training plan, exercise names don't load - only 'exercise' is displayed"
created: 2026-02-28T00:00:00Z
updated: 2026-02-28T00:02:00Z
---

## Current Focus

hypothesis: CONFIRMED AND FIXED
test: TypeScript compilation passes, fix wires up the missing data flow
expecting: Exercise names now display correctly when editing existing plans
next_action: archive session

## Symptoms

expected: Exercise names should display correctly when editing an existing training plan in the trainer's plan builder form
actual: Only "exercise" (generic text) shows instead of actual exercise names when editing
errors: None reported
reproduction: Edit any existing workout/training plan as a trainer
started: Uncertain if it ever worked correctly

## Eliminated

## Evidence

- timestamp: 2026-02-28T00:00:30Z
  checked: plan-form.tsx lines 66-79
  found: exerciseNameMap is built from existingPlan with dayIdx-exIdx keys, but then `void exerciseNameMap` discards it. Never passed to TrainingDayCard.
  implication: The name map code exists but is dead code - it was intended to be used but never wired up.

- timestamp: 2026-02-28T00:00:40Z
  checked: training-day-card.tsx lines 49-51, 163-167
  found: exerciseNames state initializes as empty {}. Only populated by handleAddExercise (new exercises). Fallback chain ends at t("plans.exercise","Exercise").
  implication: When editing, there is no mechanism to populate exercise names from existing data.

- timestamp: 2026-02-28T00:00:50Z
  checked: usePlans.ts usePlanDetail query
  found: Supabase query correctly joins exercises table and returns name. Data flows through PlanEditPage -> PlanForm correctly.
  implication: The data IS available in existingPlan.training_days[].plan_exercises[].exercises.name - it just never reaches the UI.

- timestamp: 2026-02-28T00:01:30Z
  checked: TypeScript compilation after fix
  found: Zero errors. Fix compiles cleanly.
  implication: Fix is type-safe and compatible with existing interfaces.

## Resolution

root_cause: PlanForm built an exerciseNameMap from existingPlan data but never passed it to TrainingDayCard. The map was discarded with `void exerciseNameMap` (dead code to suppress lint warning). TrainingDayCard's local exerciseNames state initialized as empty {} and only got populated when adding NEW exercises via handleAddExercise, never when loading existing ones. The fallback chain in the exerciseName prop (line 163-167) fell through to the generic translation key t("plans.exercise","Exercise").

fix: |
  1. plan-form.tsx: Replaced dead exerciseNameMap (useState + void) with initialExerciseNamesByDay (useMemo) that builds a Record<number, Record<number, string>> keyed by dayIndex then exerciseIndex.
  2. plan-form.tsx: Passed initialExerciseNames={initialExerciseNamesByDay[dayIndex]} prop to each TrainingDayCard.
  3. training-day-card.tsx: Added optional initialExerciseNames prop to interface and destructuring.
  4. training-day-card.tsx: Changed useState initializer from {} to () => initialExerciseNames ?? {} so existing exercise names are populated on mount.

verification: TypeScript compilation passes with zero errors. The data flow is now complete: Supabase query -> PlanWithDays -> PlanForm.initialExerciseNamesByDay -> TrainingDayCard.initialExerciseNames -> exerciseNames state -> ExerciseRow.exerciseName prop.

files_changed:
  - src/features/plans/components/plan-form.tsx
  - src/features/plans/components/training-day-card.tsx
