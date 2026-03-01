---
status: diagnosed
phase: 02-core-training-loop
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md]
started: 2026-02-28T00:00:00Z
updated: 2026-02-28T12:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Trainer Client List
expected: Navigate to /trainer/clients. You should see a list of clients with search input, status badges, and workout status indicators (color-coded dots). If no clients exist, you should see an empty state.
result: pass

### 2. Trainer Create Training Plan
expected: From a client's page (/trainer/clients/:clientId), the Plan tab loads without errors. If no active plan exists, shows a "Create Plan" button or empty state. Tapping "Create Plan" opens the plan builder form.
result: pass
note: Previously blocker (.single() → .maybeSingle() fix in 6e87063). Re-tested and confirmed fixed.

### 3. Exercise Picker Dialog
expected: In the plan builder, tap "Add Exercise" on a training day. A dialog opens showing the exercise library with a search input. Selecting one adds it to the day with default prescription (3 sets, 10 reps, 0 kg).
result: pass
note: No YouTube thumbnails in picker view — exercise list only. User accepted as pass.

### 4. Exercise Reorder and Day Management
expected: In the plan builder, exercises within a day have up/down chevron buttons (48px touch targets) to reorder. You can add multiple training days, and deleting an empty day happens instantly while deleting a day with exercises shows a confirmation dialog.
result: pass

### 5. Save and Activate Plan
expected: After filling out the plan form, submit it. The plan saves as a draft. On the client's plan page, a version banner shows the draft status with an "Activate" button. Tapping Activate shows a confirmation dialog. After confirming, the plan becomes the active plan for the client.
result: pass

### 6. Plan Versioning (Edit Active Plan)
expected: On a client with an active plan, tap Edit. This creates a new draft version of the plan (via RPC deep copy). You can modify the draft. When ready, activating it replaces the previous active version.
result: pass

### 7. Client View My Plan
expected: As a client, navigate to "My Plan" in the bottom nav. The active training plan displays with tabs for each training day (e.g., Day 1, Day 2). Each tab shows the exercises for that day with prescribed sets, reps, and weight.
result: pass

### 8. Client Exercise Video
expected: On the My Plan page, tap the video icon on an exercise. A collapsible section expands showing the YouTube demo video for that exercise. Tapping again collapses it.
result: issue
reported: "I can't see the video when taping the icon"
severity: major

### 9. Client Start Workout Session
expected: From a training day tab, tap "Start Workout". A full-screen workout page opens (no bottom nav) with a session timer counting up, a progress bar, and the list of exercises for that day.
result: pass

### 10. Client Log Sets with Steppers
expected: During a workout session, each exercise shows set rows with weight and reps stepper controls. Weight increments by 2.5 kg, reps increment by 1. Tap the "Log" button on a set to record it. The logged set should appear instantly (optimistic update).
result: pass

### 11. Client Finish Workout and Summary
expected: After logging sets, tap "Finish Workout" (fixed at bottom of screen). A summary screen appears showing total duration, number of sets logged, and number of exercises completed.
result: pass

### 12. Client Leave Workout Confirmation
expected: During an active workout session, try to navigate away (tap back). An alert dialog appears warning about the incomplete session but confirming that logged sets are saved. You can choose to stay or leave.
result: pass

### 13. Client Bottom Navigation
expected: As a client, the bottom navigation bar shows "My Plan" (with ClipboardList icon) and "History" items. Tapping "My Plan" navigates to the plan view.
result: pass

### 14. Bilingual Translation (EN/ES)
expected: Switch the app language between English and Spanish. All plan builder labels, workout logging text, status badges, and navigation items should display correctly in both languages.
result: pass

## Summary

total: 14
passed: 13
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Tapping video icon on exercise expands collapsible section showing YouTube demo video"
  status: failed
  reason: "User reported: I can't see the video when taping the icon"
  severity: major
  test: 8
  root_cause: "extractYouTubeVideoId() in youtube.ts uses strict 11-char regex that returns null for some valid URLs. YouTubePlayer returns null when no ID extracted, so CollapsibleContent opens but is empty. ExerciseForm uses a separate permissive URL() validation, creating a mismatch."
  artifacts:
    - path: "src/lib/utils/youtube.ts"
      issue: "Strict regex patterns miss valid YouTube URLs, returns null"
    - path: "src/features/workouts/components/youtube-player.tsx"
      issue: "Returns null when no video ID — no fallback UI"
    - path: "src/features/exercises/components/ExerciseForm.tsx"
      issue: "Uses permissive hostname-only validation, allows URLs that fail at render"
    - path: "src/features/plans/components/training-day-tab.tsx"
      issue: "CollapsibleContent wraps YouTubePlayer which renders nothing"
  missing:
    - "Unify YouTube URL validation to use single shared extractYouTubeVideoId across form and player"
    - "Make ExerciseForm reject URLs where video ID cannot be extracted"
    - "Make extractYouTubeVideoId regex less strict (handle /shorts/, varying ID lengths)"
    - "Add visible fallback in CollapsibleContent when no video available"
  debug_session: ".planning/debug/exercise-video-not-showing.md"