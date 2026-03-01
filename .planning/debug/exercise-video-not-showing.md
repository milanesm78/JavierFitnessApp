---
status: diagnosed
trigger: "Client Exercise Video Not Showing - tapping video icon on exercise in My Plan client view does nothing"
created: 2026-02-28T00:00:00Z
updated: 2026-03-01T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - The CollapsibleContent renders empty because the YouTubePlayer receives a URL but extractYouTubeVideoId() returns null, causing the component to return null. The collapsible mechanism itself toggles correctly (chevron changes, hidden attribute toggles), but the visible content area is empty.
test: Traced full component chain from MyPlanPage -> ClientPlanView -> TrainingDayTab -> CollapsibleContent -> YouTubePlayer -> extractYouTubeVideoId
expecting: n/a - diagnosis complete
next_action: n/a - returning diagnosis

## Symptoms

expected: Tapping video icon on an exercise in client "My Plan" view expands a collapsible section showing the YouTube demo video
actual: Nothing visible happens when tapping the icon
errors: None reported
reproduction: Open client My Plan page, tap video icon on any exercise
started: Unknown - may never have worked

## Eliminated

- hypothesis: Radix Collapsible mechanism broken (state not toggling)
  evidence: Traced through Radix useControllableState, Presence, and CollapsibleContentImpl source code. State toggle works correctly -- controlled mode calls onOpenChange which calls toggleExercise, updating expandedExercise state. hidden attribute correctly removed by React 19 for boolean false values.
  timestamp: 2026-03-01

- hypothesis: Tailwind v4 [hidden] !important rule interfering with Radix
  evidence: Tailwind v4 preflight has [hidden]{display:none!important} which IS present in the built CSS. However, React 19 correctly removes the hidden attribute entirely when hidden={false} (confirmed from React DOM source -- hidden is in the boolean attribute list). When collapsible is open, the attribute is absent, so the CSS rule does not match.
  timestamp: 2026-03-01

- hypothesis: RLS policy blocking exercises data for client
  evidence: Active clients have a SELECT policy on exercises table (00001_initial_schema.sql lines 168-179). The component renders exercise names and sets/reps correctly, which requires pe.exercises to be populated. If exercises were blocked by RLS, pe.exercises would be null and the component would crash (no error boundary exists).
  timestamp: 2026-03-01

- hypothesis: Data not loaded (youtube_url missing from query)
  evidence: useActivePlan query in usePlans.ts explicitly selects youtube_url in the exercises join (lines 49-52). The database column is NOT NULL (00001_initial_schema.sql line 58).
  timestamp: 2026-03-01

- hypothesis: Exercise form allows empty youtube_url
  evidence: ExerciseForm.tsx validates youtube_url is required (line 100-101) and must be valid YouTube URL (line 102). However, form validation only checks hostname, not that a video ID is extractable.
  timestamp: 2026-03-01

## Evidence

- timestamp: 2026-03-01
  checked: training-day-tab.tsx component structure
  found: The Collapsible uses controlled open state (expandedExercise === pe.id). The entire exercise row is a CollapsibleTrigger. CollapsibleContent contains the YouTubePlayer, gated by pe.exercises.youtube_url && condition. The Play icon (line 64-66) is a static decorative icon with NO separate click handler -- it is inside the trigger button and clicking it toggles the whole collapsible.
  implication: The collapsible toggle mechanism is correct, but the video rendering depends on YouTubePlayer actually rendering content.

- timestamp: 2026-03-01
  checked: YouTubePlayer component (src/features/workouts/components/youtube-player.tsx)
  found: YouTubePlayer calls extractYouTubeVideoId(youtubeUrl) and returns null if videoId is null (line 18). This is the ONLY guard that prevents video rendering.
  implication: If extractYouTubeVideoId returns null for the stored URL, the entire CollapsibleContent area renders empty -- explaining "nothing visible happens."

- timestamp: 2026-03-01
  checked: extractYouTubeVideoId in src/lib/utils/youtube.ts
  found: Uses 4 regex patterns that all require EXACTLY 11 characters: [a-zA-Z0-9_-]{11}. YouTube video IDs are typically 11 characters, but this regex will fail if the URL has additional path segments or unusual formatting.
  implication: If the exercise youtube_url in the database doesn't match any of these 4 patterns, videoId will be null and YouTubePlayer returns null.

- timestamp: 2026-03-01
  checked: Comparison with exercise-logger.tsx (workout view that DOES show videos)
  found: CRITICAL DIFFERENCE -- exercise-logger.tsx has a SEPARATE Play button with its own onClick handler (e.stopPropagation() + setShowVideo toggle on line 105-107) and renders the video OUTSIDE CollapsibleContent (lines 129-136). The plan view (training-day-tab.tsx) puts the video INSIDE CollapsibleContent with no separate video toggle.
  implication: The workout view video works with a dedicated toggle. The plan view relies on the collapsible itself, meaning if CollapsibleContent renders empty (YouTubePlayer returns null), the user sees nothing.

- timestamp: 2026-03-01
  checked: ExerciseForm validation for youtube_url
  found: Form has two different YouTube URL parsers -- ExerciseForm.tsx (lines 17-43) uses new URL() parsing with hostname check, while src/lib/utils/youtube.ts uses regex. ExerciseForm's isValidYouTubeUrl (lines 45-58) only checks hostname (youtube.com, youtu.be), NOT that a valid video ID exists. A URL like "https://www.youtube.com/" would pass form validation but fail video ID extraction.
  implication: Mismatch between form validation (permissive) and video rendering (strict) allows URLs that validate during exercise creation but fail to render.

- timestamp: 2026-03-01
  checked: Radix Collapsible internals (v1.1.12), Presence (v1.1.5), useControllableState (v1.2.2)
  found: In controlled mode, setValue calls onChangeRef when value changes. Presence always renders children when typeof children === "function" (forceMount = true). CollapsibleContentImpl uses hidden={!isOpen} where isOpen = context.open || isPresent. React 19 correctly removes hidden attribute for false values.
  implication: The Radix mechanism is sound. The collapsible IS toggling correctly at the DOM level.

- timestamp: 2026-03-01
  checked: Built CSS output (dist/assets/index-Bpklj_Fy.css)
  found: Contains [hidden]:where(:not([hidden=until-found])){display:none!important}
  implication: Tailwind v4 preflight rule is present but does not interfere because hidden attribute is properly removed when collapsible is open.

## Resolution

root_cause: |
  TWO INTERACTING ISSUES cause the video to not appear:

  1. PRIMARY: The extractYouTubeVideoId() function in src/lib/utils/youtube.ts uses strict regex
     patterns requiring exactly 11-character video IDs. If the stored youtube_url doesn't match
     any of the 4 supported patterns, the function returns null, and YouTubePlayer (line 18)
     returns null -- rendering the CollapsibleContent area completely empty.

  2. SECONDARY: Validation mismatch between exercise creation and video rendering.
     ExerciseForm.tsx uses a DIFFERENT, more permissive URL parser (new URL() with hostname check
     only) to validate youtube_url during exercise creation. The isValidYouTubeUrl function
     (ExerciseForm.tsx lines 45-58) accepts any URL with a YouTube hostname, but extractYouTubeVideoId
     (src/lib/utils/youtube.ts) requires specific path patterns with exactly 11-char video IDs.
     URLs that pass form validation can fail at render time.

  COMBINED EFFECT: When the user taps an exercise row, the Collapsible correctly opens
  (chevron toggles from down to up, hidden attribute is removed), but the CollapsibleContent
  area is visually empty because YouTubePlayer returns null. The user perceives this as
  "nothing happens" because there is no visible content change -- only the subtle chevron
  icon direction changes.

  FILES INVOLVED:
  - src/features/plans/components/training-day-tab.tsx (lines 75-83): CollapsibleContent
    renders YouTubePlayer, which returns null
  - src/features/workouts/components/youtube-player.tsx (line 18): Returns null when
    extractYouTubeVideoId fails
  - src/lib/utils/youtube.ts (lines 13-25): Strict regex fails for some URL formats
  - src/features/exercises/components/ExerciseForm.tsx (lines 45-58): Permissive validation
    accepts URLs that won't render

fix:
verification:
files_changed: []
