---
status: resolved
trigger: "Delete confirmation dialog's delete button has red text on a red background, making the text invisible"
created: 2026-02-28T00:00:00Z
updated: 2026-02-28T00:00:00Z
---

## Current Focus

hypothesis: --destructive-foreground CSS variable is set to the same value as --destructive, making text the same color as the background
test: Compare :root values for --destructive and --destructive-foreground in index.css
expecting: Both values are identical, confirming the foreground color was copy-pasted incorrectly
next_action: RESOLVED - fix --destructive-foreground to white (oklch(1 0 0))

## Symptoms

expected: White text on red background for the destructive/delete button
actual: Red text on red background — text is invisible
errors: No runtime errors; purely a visual/CSS issue
reproduction: Open the delete exercise dialog and observe the "Delete" button
started: Unknown; likely introduced when the CSS theme was initially set up

## Eliminated

- hypothesis: Button does not use the destructive variant
  evidence: DeleteExerciseDialog.tsx line 51 — variant="destructive" is explicitly set
  timestamp: 2026-02-28T00:00:00Z

- hypothesis: button.tsx does not map the destructive variant to CSS classes
  evidence: button.tsx line 13-14 — destructive variant maps to bg-destructive text-destructive-foreground, which is correct
  timestamp: 2026-02-28T00:00:00Z

## Evidence

- timestamp: 2026-02-28T00:00:00Z
  checked: src/index.css :root block, lines 60-61
  found: |
    --destructive: oklch(0.577 0.245 27.325);
    --destructive-foreground: oklch(0.577 0.245 27.325);
    Both variables have the IDENTICAL oklch value. The foreground (text) color equals the background color.
  implication: Text and background render as the same red color, making text invisible

- timestamp: 2026-02-28T00:00:00Z
  checked: src/index.css .dark block, lines 95-96
  found: |
    --destructive: oklch(0.396 0.141 25.723);
    --destructive-foreground: oklch(0.637 0.237 25.331);
    Dark mode values are DIFFERENT from each other, but --destructive-foreground is still a red hue (25.331 hue) rather than white.
  implication: Dark mode also has incorrect foreground — both light and dark modes are broken

- timestamp: 2026-02-28T00:00:00Z
  checked: src/features/exercises/components/DeleteExerciseDialog.tsx
  found: variant="destructive" used correctly on line 51
  implication: Dialog usage is correct; fault is entirely in CSS variables

- timestamp: 2026-02-28T00:00:00Z
  checked: src/components/ui/button.tsx
  found: destructive variant = "bg-destructive text-destructive-foreground hover:bg-destructive/90" (line 13-14)
  implication: Button component mapping is correct; fault is entirely in CSS variables

## Resolution

root_cause: In src/index.css, --destructive-foreground is set to the exact same oklch value as --destructive (oklch(0.577 0.245 27.325)) in the :root (light mode) block — a copy-paste error causing text color to equal background color. Dark mode also has a reddish foreground instead of white.
fix: |
  :root — change --destructive-foreground from oklch(0.577 0.245 27.325) to oklch(1 0 0) (white)
  .dark  — change --destructive-foreground from oklch(0.637 0.237 25.331) to oklch(0.985 0 0) (near-white)
verification: Not applied (diagnose-only mode)
files_changed: []
