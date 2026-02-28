---
phase: 01-foundation-and-exercise-library
plan: 04
subsystem: ui, database
tags: [exercises, form, migration, css, textarea, decimal-input]

# Dependency graph
requires:
  - phase: 01-foundation-and-exercise-library
    provides: Exercise CRUD with name and youtube_url fields, DecimalInput component
provides:
  - Exercise description and default_weight_kg fields across schema, types, form, card, and hooks
  - Readable destructive button text (white-on-red) in both themes
  - Textarea UI component
affects: [02-core-training-loop]

# Tech tracking
tech-stack:
  added: []
  patterns: [form-string-to-db-number transformation in mutation layer]

key-files:
  created:
    - supabase/migrations/00003_exercises_add_description_weight.sql
    - src/components/ui/textarea.tsx
  modified:
    - src/features/exercises/types.ts
    - src/features/exercises/components/ExerciseForm.tsx
    - src/features/exercises/components/ExerciseCard.tsx
    - src/features/exercises/hooks/useExercises.ts
    - src/types/database.ts
    - src/pages/trainer/ExercisesPage.tsx
    - src/locales/en/translation.json
    - src/locales/es/translation.json
    - src/index.css

key-decisions:
  - "DecimalInput used with number|null interface (not string) since existing component already handles locale-aware decimal input"
  - "String-to-number conversion for default_weight_kg done in mutation layer with comma-to-period normalization"

patterns-established:
  - "Form data uses string types for numeric fields; mutation layer converts to DB-native types before insert/update"

requirements-completed: [EXER-01, EXER-02]

# Metrics
duration: 6min
completed: 2026-02-28
---

# Phase 1 Plan 4: Exercise Fields and Delete Button Fix Summary

**Exercise form extended with description textarea and default weight DecimalInput; destructive button text fixed from invisible red-on-red to readable white-on-red**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-28T19:02:27Z
- **Completed:** 2026-02-28T19:08:59Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Added description (text) and default_weight_kg (numeric) columns to exercises table via migration
- Extended ExerciseForm with Textarea for description and DecimalInput for default weight
- ExerciseCard now displays description (line-clamped) and default weight when present
- Fixed destructive-foreground CSS variable in both light and dark themes for readable delete button text
- Added EN/ES translation keys for new exercise fields

## Task Commits

Each task was committed atomically:

1. **Task 1: Add description and default_weight_kg to exercise schema, types, form, and card** - `b89b063` (feat)
2. **Task 2: Fix destructive button text color (red-on-red to white-on-red)** - `0dbd849` (fix)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `supabase/migrations/00003_exercises_add_description_weight.sql` - ALTER TABLE adding description and default_weight_kg columns
- `src/components/ui/textarea.tsx` - shadcn/ui-style Textarea component
- `src/features/exercises/types.ts` - Exercise and ExerciseFormData with new fields
- `src/features/exercises/components/ExerciseForm.tsx` - Form with Textarea and DecimalInput for new fields
- `src/features/exercises/components/ExerciseCard.tsx` - Conditionally renders description and default weight
- `src/features/exercises/hooks/useExercises.ts` - Payload transformation for string-to-number conversion
- `src/types/database.ts` - Database types with description and default_weight_kg
- `src/pages/trainer/ExercisesPage.tsx` - Updated handleFormSubmit type annotation
- `src/locales/en/translation.json` - EN translations for description and default_weight
- `src/locales/es/translation.json` - ES translations for description and default_weight
- `src/index.css` - Fixed destructive-foreground CSS variable in both themes

## Decisions Made
- Used DecimalInput's native number|null interface rather than string-based state, adapting to existing component contract
- String-to-number conversion for default_weight_kg placed in mutation layer (useCreateExercise/useUpdateExercise) with comma-to-period normalization

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed ExercisesPage type mismatch after ExerciseFormData change**
- **Found during:** Task 1 (build verification)
- **Issue:** ExercisesPage.tsx had inline type `{ name: string; youtube_url: string }` instead of using ExerciseFormData, causing TS error after adding new fields
- **Fix:** Updated handleFormSubmit parameter type to use ExerciseFormData import
- **Files modified:** src/pages/trainer/ExercisesPage.tsx
- **Verification:** `pnpm build` passes with zero TypeScript errors
- **Committed in:** b89b063 (Task 1 commit)

**2. [Rule 3 - Blocking] Created missing Textarea UI component**
- **Found during:** Task 1 (form implementation)
- **Issue:** shadcn/ui Textarea component not yet installed in project
- **Fix:** Created src/components/ui/textarea.tsx following same pattern as existing Input component
- **Files modified:** src/components/ui/textarea.tsx
- **Verification:** Component renders correctly, build passes
- **Committed in:** b89b063 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for build success. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - migration was pushed via `supabase db push`. No external service configuration required.

## Next Phase Readiness
- Phase 1 exercise library is now complete with all four fields (name, YouTube URL, description, default weight)
- Delete confirmation dialog is readable in both themes
- Both UAT gaps (Test 8 and Test 10) are resolved
- Phase 1 can be marked complete

## Self-Check: PASSED

All 9 key files verified present. Both task commits (b89b063, 0dbd849) confirmed in git history.

---
*Phase: 01-foundation-and-exercise-library*
*Completed: 2026-02-28*
