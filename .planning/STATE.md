# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Clients always have their personalized training plan at their fingertips -- with video guidance, easy workout logging, and visible progress that keeps them engaged and coming back.
**Current focus:** Phase 2: Core Training Loop

## Current Position

Phase: 2 of 4 (Core Training Loop)
Plan: 3 of 4 in current phase
Status: In progress
Last activity: 2026-02-28 - Completed 01-04 (Exercise fields gap closure + delete button fix)

Progress: [██████░░░░] 55%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 12min
- Total execution time: ~82min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 4 | ~41min | 10min |
| 2 | 2 | 31min | 16min |

**Recent Trend:**
- Last 5 plans: 01-03 (~3min verification), 02-01 (9min), 02-03 (22min), 01-04 (6min)
- Trend: Stable

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
- [02-01]: Separate RLS policies per operation for trainer (not FOR ALL) matching Phase 1 convention
- [02-01]: is_trainer() SECURITY DEFINER helper for centralized JWT role checks across Phase 2 policies
- [02-01]: Plan mutations use sequential inserts (plan -> days -> exercises) for FK integrity
- [02-01]: useUpdateDraftPlan deletes and re-inserts days/exercises instead of patching
- [02-01]: Optimistic updates on useLogSet for responsive gym-floor logging
- [02-01]: Dashboard RPC with LATERAL JOINs computes all status in single query
- [02-03]: Tabs for training day navigation (3-6 days fit horizontal mobile tab bar)
- [02-03]: Collapsible exercise video behind tap to minimize distraction during logging
- [02-03]: Weight stepper +/-2.5kg, reps stepper +/-1 for standard gym progression
- [02-03]: Full-screen workout page without bottom nav for maximum screen space
- [02-03]: Accordion-style exercise loggers so client can review previous exercises
- [Phase 02]: [02-02]: Exercise names tracked via local state map since planSchema only stores exercise_id
- [Phase 02]: [02-02]: ClientsPage uses useClientDashboard RPC for single-query client data with workout status
- [Phase 02]: [02-02]: Exercise reordering via useFieldArray move() with up/down buttons (not drag-and-drop) for mobile-first v1
- [Phase 02]: [02-02]: Day/exercise orders normalized to sequential values on form submit, not during editing
- [01-04]: DecimalInput used with number|null interface for default weight, string-to-number conversion in mutation layer
- [01-04]: Form data uses string types for numeric fields; mutation layer converts to DB-native types before insert/update

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
| 3 | post-registration navigation to role portal | 2026-02-28 | f8f4c75 | [3-when-an-account-is-created-log-the-user-](./quick/3-when-an-account-is-created-log-the-user-/) |

## Session Continuity

Last session: 2026-02-28
Stopped at: Completed 01-04-PLAN.md (gap closure)
Resume file: .planning/phases/01-foundation-and-exercise-library/01-04-SUMMARY.md
