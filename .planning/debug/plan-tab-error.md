---
status: diagnosed
trigger: "Client plan page (/trainer/clients/:clientId) shows 'An error occurred' on the Plan tab"
created: 2026-02-28T00:00:00Z
updated: 2026-02-28T00:00:00Z
---

## Current Focus

hypothesis: useActivePlan uses .single() which throws when no active plan exists for client
test: Compare .single() vs .maybeSingle() usage in useActivePlan vs useClientDetail
expecting: .single() throws PGRST116 error when 0 rows returned
next_action: Return diagnosis

## Symptoms

expected: Plan tab shows "No plan assigned" empty state when client has no active plan
actual: Plan tab shows "An error occurred" error message
errors: Supabase PGRST116 error from .single() when 0 rows returned
reproduction: Navigate to /trainer/clients/:clientId for any client without an active plan
started: Since ClientDetailTabs component was created

## Eliminated

(none needed - root cause found on first hypothesis)

## Evidence

- timestamp: 2026-02-28T00:01:00Z
  checked: src/features/plans/hooks/usePlans.ts line 60
  found: useActivePlan uses .single() on the training_plans query
  implication: .single() throws error when no rows match (client has no active plan)

- timestamp: 2026-02-28T00:01:30Z
  checked: src/features/dashboard/hooks/useDashboard.ts line 87
  found: useClientDetail uses .maybeSingle() for the SAME query pattern
  implication: .maybeSingle() returns null gracefully; .single() throws. This confirms the fix pattern.

- timestamp: 2026-02-28T00:02:00Z
  checked: src/features/dashboard/components/client-detail-tabs.tsx lines 77-128
  found: PlanTab component uses useActivePlan (not useClientDetail). Error from useActivePlan triggers planError branch (line 120) showing "An error occurred" instead of reaching the empty state (line 151-174).
  implication: The empty state code "No plan assigned" is unreachable when there's no active plan because the error is caught first.

- timestamp: 2026-02-28T00:02:30Z
  checked: RLS policies in 00002_training_loop_schema.sql
  found: Trainer has SELECT access to all plans via is_trainer() policy
  implication: RLS is not the issue; the error is from Supabase PostgREST .single() semantics

## Resolution

root_cause: useActivePlan() in src/features/plans/hooks/usePlans.ts (line 60) uses .single() instead of .maybeSingle(). When a client has no active training plan, the Supabase query returns 0 rows, and .single() throws a PGRST116 error ("JSON object requested, return is 0 rows"). This error propagates to the PlanTab component which displays the generic error message instead of the "No plan assigned" empty state.
fix: Change .single() to .maybeSingle() on line 60 of usePlans.ts
verification:
files_changed: []
