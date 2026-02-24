---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified: [.env.local]
autonomous: false

must_haves:
  truths:
    - "Supabase project exists with real URL and anon key"
    - ".env.local contains real Supabase credentials (not placeholders)"
    - "Database schema (profiles, user_roles, exercises, RLS policies, triggers, Custom Access Token Hook) is applied"
    - "Custom Access Token Hook is enabled in Supabase Dashboard"
    - "Email confirmation is disabled for development"
    - "App connects to Supabase and auth flow works end-to-end"
  artifacts:
    - path: ".env.local"
      provides: "Real Supabase credentials"
      contains: "supabase.co"
  key_links:
    - from: "src/lib/supabase.ts"
      to: ".env.local"
      via: "import.meta.env.VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
      pattern: "import\\.meta\\.env\\.VITE_SUPABASE"
---

<objective>
Connect the JavierFitness app to a real Supabase project by providing credentials, applying the database migration, and configuring auth hooks.

Purpose: The app has all Supabase client code, SQL migration, and env placeholders ready (from Phase 01-01), but .env.local still has placeholder values. Auth, RLS, and all database operations are non-functional until a real Supabase project is connected.

Output: Working Supabase connection with auth, database tables, RLS policies, and Custom Access Token Hook fully operational.
</objective>

<execution_context>
@/Users/macbookpro/.claude/get-shit-done/workflows/execute-plan.md
@/Users/macbookpro/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@supabase/migrations/00001_initial_schema.sql
@src/lib/supabase.ts
@.env.example
</context>

<tasks>

<task type="checkpoint:human-action" gate="blocking">
  <name>Task 1: Create Supabase project and provide credentials</name>
  <action>
    The user must create a Supabase project (or use an existing one) and provide the project URL and anon key. These cannot be obtained programmatically without dashboard access.
  </action>
  <how-to-do-it>
    1. Go to https://supabase.com/dashboard and sign in (or create account)
    2. Click "New Project" (free tier is fine for this scale)
    3. Choose a name (e.g., "javier-fitness"), set a database password, select a region close to Spain (e.g., eu-west-1 Frankfurt or eu-west-2 London)
    4. Wait for project to provision (~2 minutes)
    5. Go to Project Settings -> API (or click the "Connect" button)
    6. Copy "Project URL" (looks like https://abcdefghij.supabase.co)
    7. Copy "anon public" key (long JWT string starting with eyJ...)
    8. Provide both values here so Claude can update .env.local
  </how-to-do-it>
  <resume-signal>Paste your Supabase Project URL and anon key</resume-signal>
</task>

<task type="auto">
  <name>Task 2: Update .env.local and apply database migration</name>
  <files>.env.local</files>
  <action>
    Once the user provides credentials:

    1. Update `.env.local` with the real Supabase URL and anon key:
       ```
       VITE_SUPABASE_URL=https://{project-id}.supabase.co
       VITE_SUPABASE_ANON_KEY={anon-key}
       ```

    2. Apply the database migration by running the SQL from `supabase/migrations/00001_initial_schema.sql` against the Supabase project. Since the Supabase CLI is not installed, use one of these approaches:
       - Option A (preferred): Install Supabase CLI via `pnpm add -g supabase` or `brew install supabase/tap/supabase`, then link and push
       - Option B: Instruct user to paste the SQL into the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> paste -> Run)

    3. Verify the connection works by starting the dev server (`pnpm dev`) and confirming the app loads without Supabase connection errors in the browser console.
  </action>
  <verify>
    - `.env.local` contains real URL (not "your-project-id") and real anon key (not "your-anon-key-here")
    - `pnpm dev` starts without errors
    - Browser console shows no Supabase connection errors when loading the app
  </verify>
  <done>.env.local has real Supabase credentials, database schema is applied, and the app connects to Supabase without errors</done>
</task>

<task type="checkpoint:human-action" gate="blocking">
  <name>Task 3: Enable Custom Access Token Hook and disable email confirmation</name>
  <action>
    These two Supabase Dashboard settings cannot be configured via CLI or API -- they require manual dashboard interaction.
  </action>
  <how-to-do-it>
    1. **Enable Custom Access Token Hook** (required for JWT role injection):
       - Go to Supabase Dashboard -> Authentication -> Hooks
       - Find "Custom Access Token Hook" and enable it
       - Select the function: `public.custom_access_token_hook`
       - Save

    2. **Disable email confirmation** (for easier development):
       - Go to Supabase Dashboard -> Authentication -> Providers -> Email
       - Toggle OFF "Confirm email"
       - Save

    3. **Verify** by signing up a test user in the app:
       - Start the dev server: `pnpm dev`
       - Navigate to the app in your browser
       - Register a new user with role "trainer"
       - Confirm you can sign in and reach the trainer portal
  </how-to-do-it>
  <resume-signal>Type "done" after enabling the hook and disabling email confirmation, or describe any issues</resume-signal>
</task>

</tasks>

<verification>
- `.env.local` contains real Supabase URL and anon key (not placeholders)
- Database has profiles, user_roles, exercises tables with RLS policies
- Custom Access Token Hook is active (JWT contains user_role claim)
- A test user can sign up, sign in, and access their portal
</verification>

<success_criteria>
The JavierFitness app connects to a live Supabase project. Auth signup/signin works end-to-end with role-based JWT claims. Database tables exist with RLS policies enforced.
</success_criteria>

<output>
After completion, update `.planning/STATE.md` blockers section to remove the Supabase setup blocker.
</output>
