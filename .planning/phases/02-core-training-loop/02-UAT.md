---
status: complete
phase: 02-core-training-loop
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md]
started: 2026-02-28T00:00:00Z
updated: 2026-02-28T00:01:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Trainer Client List
expected: Navigate to /trainer/clients. You should see a list of clients with search input, status badges, and workout status indicators (color-coded dots). If no clients exist, you should see an empty state.
result: pass

### 2. Trainer Create Training Plan
expected: From a client's page (/trainer/clients/:clientId), tap "Create Plan". A plan builder form appears with fields for plan name, cycle length, and the ability to add training days. Each day allows adding exercises via an exercise picker dialog.
result: issue
reported: "From a client's page, what I see is two tabs: Plan and Logs. Logs is empty as expected, but Plan's content show 'An error ocurred'"
severity: blocker

### 3. Exercise Picker Dialog
expected: In the plan builder, tap "Add Exercise" on a training day. A dialog opens showing the exercise library with a search input. Exercises display with name and YouTube thumbnail. Selecting one adds it to the day with default prescription (3 sets, 10 reps, 0 kg).
result: skipped
reason: Blocked by Test 2 error — cannot access plan builder

### 4. Exercise Reorder and Day Management
expected: In the plan builder, exercises within a day have up/down chevron buttons (48px touch targets) to reorder. You can add multiple training days, and deleting an empty day happens instantly while deleting a day with exercises shows a confirmation dialog.
result: skipped
reason: Blocked by Test 2 error — cannot access plan builder

### 5. Save and Activate Plan
expected: After filling out the plan form, submit it. The plan saves as a draft. On the client's plan page, a version banner shows the draft status with an "Activate" button. Tapping Activate shows a confirmation dialog. After confirming, the plan becomes the active plan for the client.
result: skipped
reason: Blocked by Test 2 error — cannot create plan

### 6. Plan Versioning (Edit Active Plan)
expected: On a client with an active plan, tap Edit. This creates a new draft version of the plan (via RPC deep copy). You can modify the draft. When ready, activating it replaces the previous active version.
result: skipped
reason: Blocked by Test 2 error — no active plan available

### 7. Client View My Plan
expected: As a client, navigate to "My Plan" in the bottom nav. The active training plan displays with tabs for each training day (e.g., Day 1, Day 2). Each tab shows the exercises for that day with prescribed sets, reps, and weight.
result: skipped
reason: Blocked by Test 2 error — no plan can be created for client to view

### 8. Client Exercise Video
expected: On the My Plan page, tap the video icon on an exercise. A collapsible section expands showing the YouTube demo video for that exercise. Tapping again collapses it.
result: skipped
reason: Blocked by Test 2 error — no plan available

### 9. Client Start Workout Session
expected: From a training day tab, tap "Start Workout". A full-screen workout page opens (no bottom nav) with a session timer counting up, a progress bar, and the list of exercises for that day.
result: skipped
reason: Blocked by Test 2 error — no plan available

### 10. Client Log Sets with Steppers
expected: During a workout session, each exercise shows set rows with weight and reps stepper controls. Weight increments by 2.5 kg, reps increment by 1. Tap the "Log" button on a set to record it. The logged set should appear instantly (optimistic update).
result: skipped
reason: Blocked by Test 2 error — cannot start workout

### 11. Client Finish Workout and Summary
expected: After logging sets, tap "Finish Workout" (fixed at bottom of screen). A summary screen appears showing total duration, number of sets logged, and number of exercises completed.
result: skipped
reason: Blocked by Test 2 error — cannot start workout

### 12. Client Leave Workout Confirmation
expected: During an active workout session, try to navigate away (tap back). An alert dialog appears warning about the incomplete session but confirming that logged sets are saved. You can choose to stay or leave.
result: skipped
reason: Blocked by Test 2 error — cannot start workout

### 13. Client Bottom Navigation
expected: As a client, the bottom navigation bar shows "My Plan" (with ClipboardList icon) and "History" items. Tapping "My Plan" navigates to the plan view.
result: skipped
reason: Blocked by Test 2 error — client plan page likely also affected

### 14. Bilingual Translation (EN/ES)
expected: Switch the app language between English and Spanish. All plan builder labels, workout logging text, status badges, and navigation items should display correctly in both languages.
result: skipped
reason: Blocked by Test 2 error — most translatable UI inaccessible

## Summary

total: 14
passed: 1
issues: 1
pending: 0
skipped: 12

## Gaps

- truth: "Client plan page loads and shows Create Plan action when no plan exists"
  status: failed
  reason: "User reported: From a client's page, what I see is two tabs: Plan and Logs. Logs is empty as expected, but Plan's content show 'An error ocurred'"
  severity: blocker
  test: 2
  root_cause: "useActivePlan() in usePlans.ts uses .single() which throws PGRST116 when no active plan exists (0 rows). Should be .maybeSingle() to return null gracefully."
  artifacts:
    - path: "src/features/plans/hooks/usePlans.ts"
      issue: ".single() on line 60 throws on 0 rows instead of returning null"
  missing:
    - "Change .single() to .maybeSingle() in useActivePlan query"
  debug_session: ".planning/debug/plan-tab-error.md"
