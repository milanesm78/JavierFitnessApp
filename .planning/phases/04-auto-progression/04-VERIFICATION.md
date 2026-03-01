---
phase: 04-auto-progression
verified: 2026-03-01T01:22:40Z
status: gaps_found
score: 8/10 must-haves verified
re_verification: false
gaps:
  - truth: "Accepting a suggestion shows a toast confirming the weight update"
    status: partial
    reason: "The accepted_toast key exists in JSON but the hook passes no interpolation params. The JSON value 'Weight updated to {{weight}}kg for {{exercise}}' will render with literal {{weight}} and {{exercise}} placeholders instead of actual values."
    artifacts:
      - path: "src/features/progression/hooks/useProgression.ts"
        issue: "t('progression.accepted_toast', 'fallback') called without {weight, exercise} params; JSON key found but interpolation fails silently, showing literal placeholder text"
    missing:
      - "Pass suggestion data (suggestedWeight, exerciseName) into the useAcceptSuggestion onSuccess callback and supply them as i18n interpolation params: t('progression.accepted_toast', { weight: ..., exercise: ... })"
  - truth: "All suggestion UI text is available in both English and Spanish"
    status: partial
    reason: "Three translation keys used by hooks are mismatched: hooks use 'accept_error' and 'dismiss_error' but JSON defines 'error_accept' and 'error_dismiss'. These keys will not be found, causing hooks to fall back to hardcoded English fallback strings. Spanish users will see English error messages."
    artifacts:
      - path: "src/features/progression/hooks/useProgression.ts"
        issue: "Lines 97 and 132 reference 'progression.accept_error' and 'progression.dismiss_error' — neither key exists in en/translation.json or es/translation.json"
      - path: "src/locales/en/translation.json"
        issue: "Defines 'error_accept' and 'error_dismiss' — not the key names the hooks look up"
      - path: "src/locales/es/translation.json"
        issue: "Defines 'error_accept' and 'error_dismiss' — not the key names the hooks look up"
    missing:
      - "Either rename JSON keys from 'error_accept'/'error_dismiss' to 'accept_error'/'dismiss_error', OR rename the hook's t() calls to match the existing JSON keys 'error_accept'/'error_dismiss'"
human_verification:
  - test: "Complete a workout with 15+ reps on an exercise logged at prescribed weight, then view the post-workout summary"
    expected: "Progression suggestion card appears between the stats grid and the Done button, showing the exercise name, current weight, suggested weight, and Accept/Dismiss buttons"
    why_human: "Requires live Supabase with the migration applied, a real workout session, and an authenticated client account"
  - test: "Accept a suggestion by tapping 'Increase Weight' and confirming in the AlertDialog"
    expected: "Toast appears; if the toast key mismatch gap is fixed it should show 'Weight updated to X kg for Exercise Name'; the suggestion disappears from the list; reloading the plan shows the updated prescribed weight"
    why_human: "Requires live database round-trip to verify weight actually updated in plan_exercises"
  - test: "Open trainer client detail Plan tab for a client with pending suggestions"
    expected: "ProgressionSuggestionList appears at the top of the Plan tab with pending suggestion cards"
    why_human: "Requires trainer account with a client who has pending suggestions"
---

# Phase 4: Auto-Progression Verification Report

**Phase Goal:** The app intelligently suggests weight increases when clients demonstrate readiness, completing the smart coaching loop
**Verified:** 2026-03-01T01:22:40Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | progression_suggestions table exists with pending/accepted/dismissed lifecycle | VERIFIED | `supabase/migrations/00005_progression_suggestions.sql` defines table with `progression_status` enum and all 11 columns |
| 2 | RPC function detects 15+ rep sets at prescribed weight and creates pending suggestions | VERIFIED | `check_progression_eligibility` RPC: queries `wsets.reps >= 15 AND wsets.weight_kg >= pe.prescribed_weight_kg`, inserts suggestion with `COALESCE(progression_increment_kg, 2.5)` |
| 3 | RPC function atomically accepts a suggestion by updating plan_exercises weight and marking suggestion accepted | VERIFIED | `accept_progression_suggestion` RPC: FOR UPDATE lock, stale check, `UPDATE plan_exercises SET prescribed_weight_kg`, then marks `status = 'accepted'` |
| 4 | Completing a workout session triggers progression detection | VERIFIED | `useCompleteSession` onSuccess calls `supabase.rpc('check_progression_eligibility', { p_session_id: data.id })` then invalidates `progressionKeys.pending(data.clientId)` |
| 5 | TanStack Query hooks provide pending suggestions, accept, and dismiss mutations | VERIFIED | `useProgression.ts`: progressionKeys factory + `useCheckProgression`, `usePendingSuggestions`, `useAcceptSuggestion`, `useDismissSuggestion` — all substantive, all wired |
| 6 | After completing a workout, the post-workout summary shows progression suggestions | VERIFIED | `session-summary.tsx` imports and renders `<ProgressionSuggestionList clientId={clientId} />` between stats grid and Done button; `workout-session.tsx` passes `clientId={clientId!}` |
| 7 | Client can accept or dismiss a suggestion and weight updates | VERIFIED | `ProgressionSuggestionCard` calls `acceptMutation.mutate(suggestion.id)` / `dismissMutation.mutate(suggestion.id)`; accept uses AlertDialog confirmation; stale check disables accept when weight has changed |
| 8 | Trainer can see and act on pending suggestions in client detail view | VERIFIED | `client-detail-tabs.tsx` imports and renders `<ProgressionSuggestionList clientId={clientId} />` at top of PlanTab (line 154) |
| 9 | Accepting a suggestion shows a toast confirming the weight update | PARTIAL | `accepted_toast` key found in JSON, but hook calls `t('progression.accepted_toast', 'fallback')` without `{weight, exercise}` interpolation params — toast will render literal `{{weight}}` and `{{exercise}}` placeholders |
| 10 | All suggestion UI text is available in both English and Spanish | PARTIAL | 11/13 keys correctly matched; hooks use `accept_error` / `dismiss_error` but JSON defines `error_accept` / `error_dismiss` — error toasts fall back to English hardcoded strings in both locales |

**Score:** 8/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/00005_progression_suggestions.sql` | Table, 3 RPCs, RLS, index | VERIFIED | 294 lines; table + enum + index + 3 RLS policies + 3 RPC functions, SECURITY INVOKER, stale check, warm-up filter, 3-session cooldown |
| `src/features/progression/types.ts` | ProgressionSuggestion, ProgressionStatus types | VERIFIED | 25 lines; exports ProgressionStatus, ProgressionSuggestion (with optional exercise/plan_exercise joins), ProgressionSuggestionWithExercise |
| `src/features/progression/hooks/useProgression.ts` | progressionKeys + 4 hooks | VERIFIED | 137 lines; all 4 hooks present and substantive with proper supabase calls |
| `src/types/database.ts` | progression_suggestions table + 3 RPC signatures + exercises.progression_increment_kg | VERIFIED | Lines 27, 100-122 (progression_increment_kg), 354 (progression_suggestions), 423-453 (3 RPC functions) |
| `src/features/workouts/hooks/useWorkoutMutations.ts` | useCompleteSession calls check_progression_eligibility | VERIFIED | Lines 155-170: fire-and-forget rpc call with .then()/.catch() after session completion |
| `src/features/progression/components/ProgressionSuggestionCard.tsx` | Single suggestion card with accept/dismiss | VERIFIED | 140 lines; exercise name, weight comparison arrows, AlertDialog confirmation, stale detection, both mutations wired |
| `src/features/progression/components/ProgressionSuggestionList.tsx` | List with heading, renders null when empty | VERIFIED | 39 lines; uses usePendingSuggestions hook, returns null when empty (intentional design), maps to ProgressionSuggestionCard |
| `src/features/workouts/components/session-summary.tsx` | Post-workout summary with suggestions section | VERIFIED | Imports and renders ProgressionSuggestionList with clientId between stats grid and Done button |
| `src/features/dashboard/components/client-detail-tabs.tsx` | Trainer client detail with suggestions in Plan tab | VERIFIED | Line 154: ProgressionSuggestionList at top of PlanTab return |
| `src/locales/en/translation.json` | English progression keys | PARTIAL | 14 keys present including all required; but JSON uses `error_accept`/`error_dismiss` while hooks look up `accept_error`/`dismiss_error` |
| `src/locales/es/translation.json` | Spanish progression keys | PARTIAL | 14 keys present including all required; same key name mismatch as EN file |
| `src/components/ui/alert.tsx` | shadcn/ui Alert component | VERIFIED | File exists |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `useWorkoutMutations.ts` | `check_progression_eligibility` RPC | `supabase.rpc` in useCompleteSession onSuccess | WIRED | Line 159: `.rpc("check_progression_eligibility", { p_session_id: data.id })` |
| `useProgression.ts` | `accept_progression_suggestion` RPC | `supabase.rpc` in useAcceptSuggestion | WIRED | Line 77: `.rpc("accept_progression_suggestion", { p_suggestion_id: ... })` |
| `useProgression.ts` | `progression_suggestions` table | `supabase.from` in usePendingSuggestions | WIRED | Line 51: `.from("progression_suggestions").select("*, exercise:exercises(name)...")` |
| `session-summary.tsx` | `ProgressionSuggestionList` | Import + render in JSX | WIRED | Line 6: import; Line 84: `<ProgressionSuggestionList clientId={clientId} />` |
| `ProgressionSuggestionCard.tsx` | `useAcceptSuggestion` + `useDismissSuggestion` | Import + call in handlers | WIRED | Line 16: import; Lines 33-34: mutation calls; Lines 41-47: handlers |
| `client-detail-tabs.tsx` | `ProgressionSuggestionList` | Import + render in PlanTab | WIRED | Line 23: import; Line 154: `<ProgressionSuggestionList clientId={clientId} />` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| PROG-01 | 04-01, 04-02 | App detects when client logs 15+ reps on an exercise and suggests +2.5kg for next session | SATISFIED | `check_progression_eligibility` RPC queries `reps >= 15`, inserts suggestion with `current_weight_kg + COALESCE(progression_increment_kg, 2.5)`. UI displays suggestion card with both weights. |
| PROG-02 | 04-01, 04-02 | Auto-progression is a suggestion — client or trainer confirms before applying | SATISFIED | Suggestions appear as cards with explicit Accept/Dismiss buttons. Accept uses AlertDialog confirmation dialog. Weight only updates when `accept_progression_suggestion` RPC is called. |

Both PROG-01 and PROG-02 are satisfied. Requirements.md correctly shows both as Phase 4 / Complete.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `ProgressionSuggestionList.tsx` | 23 | `return null` | Info | Intentional design — renders nothing when no suggestions; stated decision in plan frontmatter |
| `useProgression.ts` | 97 | `t("progression.accept_error", ...)` | Warning | Key not in JSON; falls back to English hardcoded string — Spanish error messages broken |
| `useProgression.ts` | 132 | `t("progression.dismiss_error", ...)` | Warning | Key not in JSON; falls back to English hardcoded string — Spanish error messages broken |
| `useProgression.ts` | 91 | `t("progression.accepted_toast", "fallback")` with no params | Warning | JSON key found but has `{{weight}}/{{exercise}}` placeholders; called without params so renders literal placeholder text |

### Human Verification Required

#### 1. Post-Workout Suggestion Display

**Test:** Log a workout as a client with 15+ reps on at least one exercise at the prescribed weight, then tap "Finish Workout"
**Expected:** The post-workout summary shows a progression suggestion card with the exercise name, current weight, arrow, and suggested weight (current + 2.5kg), plus Accept and Dismiss buttons — positioned between the stats grid and the Done button
**Why human:** Requires live Supabase instance with migration applied, authenticated client session, and an active training plan with prescribed weights

#### 2. Accept Flow End-to-End

**Test:** Tap "Increase Weight" on a suggestion card, confirm in the AlertDialog
**Expected:** AlertDialog appears first (confirmation step); on confirm, the suggestion disappears from the list, and checking the training plan shows the new prescribed weight; a toast appears (pending gap fix: should show "Weight updated to Xkg for Exercise Name" but currently shows literal placeholders)
**Why human:** Weight update in plan_exercises can only be verified with live database access

#### 3. Dismiss and Cooldown

**Test:** Tap "Not Now" on a suggestion card
**Expected:** Suggestion disappears immediately; completing 3 more sessions on the same exercise at 15+ reps re-triggers the suggestion
**Why human:** Cooldown behavior requires completing multiple workout sessions over time

#### 4. Trainer Client Detail View

**Test:** Log in as trainer, open a client's detail page, navigate to the Plan tab
**Expected:** If that client has pending suggestions, the ProgressionSuggestionList appears at the top of the Plan tab (before the draft banner and plan card); trainer can accept or dismiss from here
**Why human:** Requires both trainer and client accounts with specific data state

### Gaps Summary

Two gaps were identified, both within i18n translation key alignment:

**Gap 1 — accepted_toast missing interpolation params:** The JSON defines `"accepted_toast": "Weight updated to {{weight}}kg for {{exercise}}"` with two interpolation variables. The hook calls `t('progression.accepted_toast', 'fallback')` with no variables object. Because i18next finds the key but cannot resolve `{{weight}}` and `{{exercise}}`, the toast renders literal placeholder text to the user. Fix: pass `{ weight: suggestion.suggested_weight_kg, exercise: exerciseName }` to the t() call, requiring the suggestion data to be in scope in `useAcceptSuggestion`'s onSuccess — which currently only receives `void`. The hook's mutation would need to receive and return the weight/exercise context, or the card could call a custom onSuccess callback.

**Gap 2 — error key name mismatch:** Hooks reference `progression.accept_error` and `progression.dismiss_error`. Both locale JSON files define `error_accept` and `error_dismiss`. When the keys are not found, i18next falls back to the hardcoded English fallback strings in the `t()` call — so English users see correct (hardcoded) error messages, but Spanish users also see English error messages instead of the translated Spanish strings. Fix: align key names in either the JSON files or the hook's t() calls.

These gaps affect polish and the Spanish locale experience, but the core feature goal — suggestion detection, display, and accept/dismiss lifecycle — is fully functional. PROG-01 and PROG-02 are satisfied.

---
_Verified: 2026-03-01T01:22:40Z_
_Verifier: Claude (gsd-verifier)_
