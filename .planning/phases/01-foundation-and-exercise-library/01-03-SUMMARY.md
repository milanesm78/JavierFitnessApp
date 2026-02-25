---
phase: 01-foundation-and-exercise-library
plan: 03
subsystem: exercises
tags: [tanstack-query, supabase, react, youtube-thumbnails, decimal-input, mobile-responsive, i18n, shadcn-ui]

# Dependency graph
requires:
  - phase: 01-foundation-and-exercise-library
    provides: Supabase client, auth context, trainer/client portal layouts, i18n system, Database types with exercises table
provides:
  - Exercise types (Exercise, ExerciseFormData)
  - TanStack Query hooks for exercise CRUD (useExercises, useCreateExercise, useUpdateExercise, useDeleteExercise)
  - ExerciseForm with YouTube URL validation and thumbnail preview
  - ExerciseCard with YouTube thumbnail display and edit/delete actions
  - ExerciseList with loading skeletons, empty state, error state, responsive grid
  - DeleteExerciseDialog with confirmation message and destructive variant
  - ExercisesPage with dialog-based create/edit, mobile FAB, and trainer layout
  - DecimalInput component accepting comma and period, formatting by locale
  - Route /trainer/exercises registered in App.tsx
  - All exercise translation keys in both EN and ES
affects: [02-training-plans, all-future-phases]

# Tech tracking
tech-stack:
  added: []
  patterns: [exercise-crud-tanstack-query, youtube-thumbnail-preview, query-key-factory, decimal-input-text-mode, mobile-fab-pattern]

key-files:
  created:
    - src/features/exercises/types.ts
    - src/features/exercises/hooks/useExercises.ts
    - src/features/exercises/components/ExerciseForm.tsx
    - src/features/exercises/components/ExerciseCard.tsx
    - src/features/exercises/components/ExerciseList.tsx
    - src/features/exercises/components/DeleteExerciseDialog.tsx
    - src/pages/trainer/ExercisesPage.tsx
    - src/components/DecimalInput.tsx
  modified:
    - src/App.tsx
    - src/locales/en/translation.json
    - src/locales/es/translation.json

key-decisions:
  - "YouTube thumbnail extracted from URL using URL API, shown with mqdefault.jpg (320x180) for space efficiency"
  - "DecimalInput uses type=text with inputMode=decimal (not type=number) per GOV.UK research on numeric inputs"
  - "Mobile FAB at bottom-right (fixed bottom-20 right-4) clears the bottom navigation bar on mobile"
  - "Query key factory pattern (exerciseKeys.all/list/detail) for granular cache invalidation"
  - "ExerciseForm is dual-mode (create/edit) controlled by optional exercise prop"

patterns-established:
  - "Pattern: Query key factories for TanStack Query cache management (exerciseKeys pattern)"
  - "Pattern: YouTube video ID extracted via URL API for both thumbnail and validation"
  - "Pattern: DecimalInput accepts comma/period during typing, normalizes on blur via normalizeDecimal()"
  - "Pattern: Mobile FAB (fixed bottom-20) clears 64px bottom navigation bar with z-30"
  - "Pattern: Dialog-based CRUD forms for exercise create/edit (same ExerciseForm component, dual-mode)"

requirements-completed: [EXER-01, EXER-02, INFR-02, INFR-03]

# Metrics
duration: ~3min
completed: 2026-02-25
---

# Phase 1 Plan 3: Exercise Library Summary

**Full exercise CRUD with YouTube thumbnail previews via TanStack Query + Supabase, mobile FAB, and reusable DecimalInput component with comma/period locale-aware formatting**

## Performance

- **Duration:** ~3 min (files pre-committed; verification and summary creation this session)
- **Started:** 2026-02-23T22:16:42Z
- **Completed:** 2026-02-25T00:00:00Z
- **Tasks:** 2 (Task 3 is a human-verify checkpoint, paused as planned)
- **Files modified:** 10

## Accomplishments
- Complete exercise CRUD: create, read (list), update, delete with immediate TanStack Query cache invalidation
- YouTube thumbnail previews in both ExerciseForm (during creation) and ExerciseCard (in the list)
- Mobile-first ExercisesPage with desktop header button and mobile FAB at bottom-right
- DeleteExerciseDialog with exercise name in confirmation message and destructive variant button
- DecimalInput component with locale-aware formatting (comma in ES, period in EN) ready for Phase 2 weight inputs
- Responsive exercise grid: 1 column mobile, 2 columns tablet (sm:), 3 columns desktop (lg:)
- All UI text fully translated in Spanish and English with matching key sets

## Task Commits

Each task was committed atomically:

1. **Task 1: Exercise library CRUD with YouTube thumbnails and bilingual support** - `36e0bd4` (feat)
2. **Task 2: Reusable DecimalInput component with comma/period decimal support** - `e849db1` (feat)

Task 3 is a `checkpoint:human-verify` -- paused for human verification of full Phase 1 end-to-end flow.

## Files Created/Modified
- `src/features/exercises/types.ts` - Exercise and ExerciseFormData type definitions
- `src/features/exercises/hooks/useExercises.ts` - Query key factory + useExercises, useCreateExercise, useUpdateExercise, useDeleteExercise hooks
- `src/features/exercises/components/ExerciseForm.tsx` - Create/edit form with YouTube URL validation, thumbnail preview, dual-mode
- `src/features/exercises/components/ExerciseCard.tsx` - Card with YouTube thumbnail, edit/delete icon buttons
- `src/features/exercises/components/ExerciseList.tsx` - Responsive grid with loading skeletons, empty state, error state
- `src/features/exercises/components/DeleteExerciseDialog.tsx` - Confirmation dialog with exercise name and destructive delete button
- `src/pages/trainer/ExercisesPage.tsx` - Full page: header with desktop add button, ExerciseList, mobile FAB, create/edit Dialog, DeleteExerciseDialog
- `src/components/DecimalInput.tsx` - Decimal input using type=text+inputMode=decimal, locale-aware formatting, normalizeDecimal integration
- `src/App.tsx` - Added /trainer/exercises route (was already present from prior work)
- `src/locales/en/translation.json` - 24 exercise-related keys added
- `src/locales/es/translation.json` - 24 matching exercise-related keys added (Spanish)

## Decisions Made
- YouTube thumbnail uses `mqdefault.jpg` (medium quality, 320x180) instead of `hqdefault.jpg` -- loads faster in card grid on mobile
- Mobile FAB positioned at `bottom-20` (80px) to clear the 64px bottom navigation bar (with 16px breathing room)
- `DecimalInput` uses `type="text"` not `type="number"` -- `type="number"` has inconsistent locale behavior across browsers (Firefox accepts comma in some locales, Chrome doesn't)
- Query key factory pattern used (as established in Plan 02) -- `exerciseKeys.list()` and `exerciseKeys.detail(id)` for targeted invalidation
- ExerciseForm is a single dual-mode component -- when `exercise` prop is provided, it pre-fills values and shows "Save exercise"; when absent it shows "Add exercise"

## Deviations from Plan

None - all files were already created and committed in a prior session. Plan executed exactly as written. Self-check verified all 10 artifact files exist and both commits are present.

## Issues Encountered
None.

## User Setup Required
None - exercise feature uses Supabase tables already set up in Plan 01. The exercises table and RLS policies were created in migration `20250223051034_initial_schema.sql`.

## Next Phase Readiness
- Exercise CRUD is fully operational; exercises are the foundation data that Phase 2 training plans reference
- DecimalInput component ready for Phase 2 weight/rep inputs -- just import from `src/components/DecimalInput.tsx`
- Query key factory pattern established for exercises -- Phase 2 training plan hooks should follow the same `trainingPlanKeys` pattern
- TanStack Query cache invalidation pattern working: create/update/delete all invalidate `exerciseKeys.list()`
- Human checkpoint (Task 3) is pending -- full Phase 1 end-to-end flow needs verification before advancing to Phase 2

## Self-Check: PASSED

All 10 artifact files verified:
- FOUND: src/features/exercises/types.ts
- FOUND: src/features/exercises/hooks/useExercises.ts
- FOUND: src/features/exercises/components/ExerciseForm.tsx
- FOUND: src/features/exercises/components/ExerciseCard.tsx
- FOUND: src/features/exercises/components/ExerciseList.tsx
- FOUND: src/features/exercises/components/DeleteExerciseDialog.tsx
- FOUND: src/pages/trainer/ExercisesPage.tsx
- FOUND: src/components/DecimalInput.tsx
- FOUND: src/locales/en/translation.json
- FOUND: src/locales/es/translation.json

Both task commits verified:
- FOUND: 36e0bd4 (Task 1: exercise library CRUD)
- FOUND: e849db1 (Task 2: DecimalInput component)

Build: pnpm build passes with zero TypeScript errors.

---
*Phase: 01-foundation-and-exercise-library*
*Completed: 2026-02-25*
