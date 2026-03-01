# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Clients always have their personalized training plan at their fingertips -- with video guidance, easy workout logging, and visible progress that keeps them engaged and coming back.
**Current focus:** Completed 02-04 SUMMARY backfill

## Current Position

Phase: 4 of 4 (Auto-Progression) + gap closures
Plan: 02-04 SUMMARY backfilled, all plans complete
Status: SUMMARY backfill complete
Last activity: 2026-03-01 - Backfilled 02-04-SUMMARY.md (was missing from prior session)

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 13
- Average duration: 10min
- Total execution time: ~138min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 4 | ~41min | 10min |
| 2 | 4 | 46min | 12min |
| 3 | 2 | 27min | 14min |
| 4 | 3 | 14min | 5min |

**Recent Trend:**
- Last 5 plans: 03-02 (17min), 04-01 (6min), 04-02 (5min), 04-03 (3min), 02-05 (7min)
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
- [03-01]: Migration file numbered 00004 (not 00003 as plan suggested) because 00003 already exists
- [03-01]: Zod schema uses z.union([z.number(), z.null()]) to avoid react-hook-form type mismatch with Zod v4
- [03-01]: MEASUREMENT_FIELDS constant organizes field metadata by category for data-driven form rendering
- [03-02]: Recharts LineChart with ResponsiveContainer (300px), preserveStartEnd, MMM yy date format for mobile-optimized charts
- [03-02]: CHART_COLORS uses HSL values for consistent contrast on both light and dark themes
- [03-02]: MEASUREMENT_CHART_FIELDS constant maps measurement fields to i18n keys, units, and categories for data-driven selector UI
- [03-02]: useTranslation() called directly in sub-components rather than passing t as prop to avoid i18next type narrowing issues
- [04-01]: SECURITY INVOKER for all 3 progression RPC functions so RLS applies in calling user's context
- [04-01]: Fire-and-forget pattern for progression detection in useCompleteSession onSuccess
- [04-01]: Stale suggestion auto-dismiss on accept when prescribed weight has changed
- [04-01]: 3-session cooldown for re-suggestion after dismissal, counted by completed sessions
- [04-01]: Per-exercise increment via COALESCE(progression_increment_kg, 2.5) -- NULL defaults to 2.5kg
- [04-01]: Warm-up filter: only evaluate sets where weight_kg >= prescribed_weight_kg
- [04-02]: AlertDialog confirmation for accept action (irreversible weight changes on mobile touch targets)
- [04-02]: ProgressionSuggestionList renders null when no suggestions (no empty state clutter)
- [04-02]: Stale detection compares plan_exercise.prescribed_weight_kg to suggestion.current_weight_kg
- [04-02]: Suggestions placed between stats and Done button on post-workout summary
- [04-02]: Suggestions placed at top of trainer PlanTab for immediate visibility
- [04-03]: Mutation accepts context object {suggestionId, exerciseName, suggestedWeight} so onSuccess can interpolate toast without refetching
- [04-03]: Renamed JSON keys (error_accept -> accept_error) rather than changing hook references, since hook naming convention (verb_noun) is more natural
- [02-04]: Expandable cards for workout history (tap to reveal sets) for compact mobile layout
- [02-04]: Client-side search filter for trainer client list (20-50 clients fits in memory)
- [02-04]: ClientPlanPage consolidated into ClientDetailTabs Plan tab; original file deleted
- [02-04]: ClientDetailTabs expanded to 4 tabs (Plan, Logs, Progress, Measurements) to include Phase 3/4 features
- [02-05]: URL()-based YouTube parser replacing strict regex -- handles all URL formats including /shorts/
- [02-05]: isValidYouTubeUrl delegates to extractYouTubeVideoId -- validation tied to extractability eliminates mismatch

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

Last session: 2026-03-01
Stopped at: Completed 02-04-PLAN.md (SUMMARY backfill)
Resume file: .planning/phases/02-core-training-loop/02-04-SUMMARY.md
