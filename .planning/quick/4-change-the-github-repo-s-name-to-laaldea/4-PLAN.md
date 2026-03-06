---
phase: quick
plan: 4
type: execute
wave: 1
depends_on: []
files_modified: [supabase/config.toml]
autonomous: true
requirements: [QUICK-4]

must_haves:
  truths:
    - "GitHub repo is named LaAldeaFitApp"
    - "Local git remote origin points to the renamed repo URL"
    - "supabase/config.toml project_id reflects the new name"
  artifacts:
    - path: "supabase/config.toml"
      provides: "Updated project_id"
      contains: "LaAldeaFitApp"
  key_links:
    - from: "local git remote"
      to: "GitHub repo"
      via: "origin URL"
      pattern: "LaAldeaFitApp"
---

<objective>
Rename the GitHub repository from JavierFitnessApp to LaAldeaFitApp and update all local references.

Purpose: Rebrand the repository to match the desired project name.
Output: Renamed GitHub repo, updated git remote, updated config references.
</objective>

<execution_context>
@/Users/macbookpro/.claude/get-shit-done/workflows/execute-plan.md
@/Users/macbookpro/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Current remote: origin https://github.com/milanesm78/JavierFitnessApp.git
Files referencing "JavierFitnessApp": supabase/config.toml (project_id), two .planning/debug docs (informational only, no update needed).
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rename GitHub repo and update local references</name>
  <files>supabase/config.toml</files>
  <action>
1. Rename the GitHub repository using the GitHub CLI:
   `gh repo rename LaAldeaFitApp`
   This renames the repo on GitHub. GitHub automatically redirects the old URL, but the local remote should be updated explicitly.

2. Update the local git remote origin URL to the new repo name:
   `git remote set-url origin https://github.com/milanesm78/LaAldeaFitApp.git`

3. Update `supabase/config.toml` line 5: change `project_id = "JavierFitnessApp"` to `project_id = "LaAldeaFitApp"`.

4. The two .planning/debug/ markdown files that mention "JavierFitnessApp" are historical debug logs -- leave them as-is (they document what happened, not current config).

Note: package.json already uses "javier-fitness" as the name, which is a separate npm package name and does not need to change for a GitHub repo rename.
  </action>
  <verify>
- `gh repo view --json name -q '.name'` returns "LaAldeaFitApp"
- `git remote get-url origin` returns "https://github.com/milanesm78/LaAldeaFitApp.git"
- `grep project_id supabase/config.toml` shows "LaAldeaFitApp"
- `git fetch origin` succeeds (confirms remote is reachable)
  </verify>
  <done>GitHub repo is named LaAldeaFitApp, local remote points to the new URL, and supabase config reflects the new name.</done>
</task>

</tasks>

<verification>
- GitHub repo accessible at https://github.com/milanesm78/LaAldeaFitApp
- Local git operations (fetch, push) work against the renamed remote
- No broken references in active config files
</verification>

<success_criteria>
- Repository name on GitHub is LaAldeaFitApp
- Local git remote origin URL updated
- supabase/config.toml project_id updated
- git fetch succeeds against new remote
</success_criteria>

<output>
After completion, create `.planning/quick/4-change-the-github-repo-s-name-to-laaldea/4-SUMMARY.md`
</output>
