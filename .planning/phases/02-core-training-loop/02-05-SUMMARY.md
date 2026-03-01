---
phase: 02-core-training-loop
plan: 05
subsystem: ui
tags: [youtube, url-parsing, video-player, react, i18n]

# Dependency graph
requires:
  - phase: 02-core-training-loop
    provides: "ExerciseForm, ExerciseCard, YouTubePlayer, training-day-tab components"
provides:
  - "Unified YouTube URL parser (extractYouTubeVideoId, isValidYouTubeUrl, getYouTubeThumbnailUrl)"
  - "YouTubePlayer with fallback UI for failed video ID extraction"
  - "Form validation tied to extractability (no validation/extraction mismatch)"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single source of truth for URL parsing: all components import from src/lib/utils/youtube.ts"
    - "URL()-based parsing instead of regex for robust YouTube URL handling"
    - "Validation tied to extractability: isValidYouTubeUrl wraps extractYouTubeVideoId"

key-files:
  created: []
  modified:
    - src/lib/utils/youtube.ts
    - src/features/exercises/components/ExerciseForm.tsx
    - src/features/exercises/components/ExerciseCard.tsx
    - src/features/workouts/components/youtube-player.tsx
    - src/locales/en/translation.json
    - src/locales/es/translation.json

key-decisions:
  - "URL()-based parser replacing regex approach for robustness across all YouTube URL formats"
  - "isValidYouTubeUrl delegates to extractYouTubeVideoId -- URL is valid iff video ID can be extracted"
  - "Visible fallback UI instead of null return when video extraction fails"

patterns-established:
  - "YouTube URL parsing: always import from @/lib/utils/youtube, never create local extractors"

requirements-completed: [EXER-03]

# Metrics
duration: 7min
completed: 2026-03-01
---

# Phase 02 Plan 05: YouTube Video Fix Summary

**Unified YouTube URL parsing with fallback UI -- fixes client plan view video rendering (UAT Test 8)**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-01T15:35:43Z
- **Completed:** 2026-03-01T15:42:36Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Single extractYouTubeVideoId in src/lib/utils/youtube.ts handles all YouTube URL formats including /shorts/
- ExerciseForm and ExerciseCard use shared module instead of local duplicate implementations
- Form validation tied to extractability -- URLs that pass validation will always produce playable video
- YouTubePlayer shows visible "Video unavailable" fallback instead of silent null return

## Task Commits

Each task was committed atomically:

1. **Task 1: Unify YouTube URL parsing into shared module** - `046d96d` (fix)
2. **Task 2: Add YouTubePlayer fallback UI and i18n keys** - `157c2cc` (fix)

## Files Created/Modified
- `src/lib/utils/youtube.ts` - Rewritten with URL()-based parser supporting /watch, /embed, /shorts, /v, youtu.be; added isValidYouTubeUrl export
- `src/features/exercises/components/ExerciseForm.tsx` - Removed local extractYouTubeVideoId and isValidYouTubeUrl, imports from shared module
- `src/features/exercises/components/ExerciseCard.tsx` - Removed local extractYouTubeVideoId, imports from shared module
- `src/features/workouts/components/youtube-player.tsx` - Replaced null return with visible fallback UI, added i18n translation
- `src/features/workouts/hooks/useWorkoutMutations.ts` - Fixed pre-existing PromiseLike.catch TS error with Promise.resolve wrapper
- `src/locales/en/translation.json` - Added plan.videoUnavailable key
- `src/locales/es/translation.json` - Added plan.videoUnavailable key

## Decisions Made
- URL()-based parser replacing strict regex approach: the regex enforced exactly 11 characters and missed /shorts/ URLs. URL() parsing is more robust and handles all hostname/path variations naturally.
- isValidYouTubeUrl delegates to extractYouTubeVideoId: this eliminates the root cause of UAT Test 8 failure where URLs passed hostname-only validation but failed at render-time extraction.
- Visible "Video unavailable" fallback: instead of returning null (causing blank CollapsibleContent), the player shows a user-visible message so the UI is never unexpectedly empty.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing PromiseLike.catch TypeScript error**
- **Found during:** Task 1 (build verification)
- **Issue:** `src/features/workouts/hooks/useWorkoutMutations.ts` had a TS2339 error -- `.catch()` does not exist on `PromiseLike<void>` (Supabase RPC return type)
- **Fix:** Wrapped `supabase.rpc()` call in `Promise.resolve()` to convert `PromiseLike` to full `Promise` with `.catch()` support
- **Files modified:** src/features/workouts/hooks/useWorkoutMutations.ts
- **Verification:** pnpm build passes with zero errors
- **Committed in:** 046d96d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor fix to unrelated file required for build verification. No scope creep.

## Issues Encountered
None beyond the pre-existing build error documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- YouTube video rendering in client plan view is fixed
- UAT Test 8 gap closure complete
- All YouTube URL formats supported across all components

---
*Phase: 02-core-training-loop*
*Completed: 2026-03-01*
