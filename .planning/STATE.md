# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Clients always have their personalized training plan at their fingertips -- with video guidance, easy workout logging, and visible progress that keeps them engaged and coming back.
**Current focus:** Phase 1: Foundation and Exercise Library

## Current Position

Phase: 1 of 4 (Foundation and Exercise Library)
Plan: 3 of 3 in current phase (Tasks 1 & 2 complete; Task 3 is human-verify checkpoint)
Status: Awaiting human verification (Phase 1 checkpoint)
Last activity: 2026-02-25 - Completed 01-03 Tasks 1 & 2; paused at human-verify checkpoint

Progress: [███░░░░░░░] 30%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 12min
- Total execution time: ~36min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 3 | ~35min | 12min |

**Recent Trend:**
- Last 5 plans: 01-01 (20min), 01-02 (9min), 01-03 (~3min verification)
- Trend: Accelerating

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 4 phases derived from requirement dependencies -- foundation first, then training loop, then visualization, then intelligence
- [Roadmap]: PLAN-05 and PLAN-06 (cycle length and plan versioning) placed in Phase 2 with the plan builder, not deferred to Phase 4, because the data model must support immutability from the start (research flagged this as critical pitfall)
- [01-01]: Used @vitejs/plugin-react-swc for faster builds
- [01-01]: Bundled translations directly instead of HTTP lazy loading (only 2 languages)
- [01-01]: Spanish as fallback language per primary user base
- [01-01]: Zinc palette for shadcn/ui with dark/light theme CSS variables
- [01-01]: 10 granular RLS policies (separate per operation, never FOR ALL)
- [01-01]: Custom Access Token Hook for JWT role injection (not user_metadata)
- [01-02]: JWT role decoded client-side via atob(token.split('.')[1]) without external library
- [01-02]: ThemeProvider defaults to dark theme for fitness app convention
- [01-02]: Database types restructured to explicit field listings for Supabase v2 typed client compatibility
- [01-02]: Role selection via toggle buttons for better mobile UX
- [01-02]: Bottom navigation for both portals with large touch targets for gym use
- [quick-1]: Installed Supabase CLI via Homebrew for db push and config management
- [quick-1]: Used supabase config push to enable Custom Access Token Hook and disable email confirmation remotely
- [quick-1]: Added *.tsbuildinfo to .gitignore to exclude TypeScript build cache
- [01-03]: YouTube thumbnail uses mqdefault.jpg (320x180) for card grid performance on mobile
- [01-03]: DecimalInput uses type=text+inputMode=decimal (not type=number) per GOV.UK research on numeric inputs
- [01-03]: Mobile FAB positioned at bottom-20 to clear 64px bottom nav bar with breathing room
- [01-03]: Query key factory pattern (exerciseKeys.all/list/detail) for granular cache invalidation

### Pending Todos

None yet.

### Blockers/Concerns

- ~~[01-01]: Supabase project must be created and .env.local configured before auth features will fully work~~ **RESOLVED** (quick-1, 2026-02-25)
- [Research]: Anthropometric measurement ranges should be confirmed with Javier before Phase 3
- [Research]: Auto-progression rule specifics (which sets count, session threshold, fixed vs variable increment) must be clarified with Javier before Phase 4

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | connect project to supabase | 2026-02-24 | be457a5 | [1-connect-project-to-supabase](./quick/1-connect-project-to-supabase/) |

## Session Continuity

Last session: 2026-02-25
Stopped at: 01-03 Tasks 1 & 2 complete; awaiting human verification at checkpoint Task 3
Resume file: .planning/phases/01-foundation-and-exercise-library/01-03-SUMMARY.md
