# Domain Pitfalls

**Domain:** Fitness coaching platform (trainer-client, per-set workout logging, anthropometric tracking)
**Project:** JavierFitness
**Researched:** 2026-02-21
**Confidence:** MEDIUM (based on training data domain knowledge; web search unavailable for verification)

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or product abandonment.

### Pitfall 1: Flattened Workout Data Model

**What goes wrong:** The database schema treats workouts as flat records (one row per exercise or per workout) instead of modeling the full hierarchy: Plan -> Training Day -> Exercise Slot -> Session Log -> Individual Set. Developers flatten this because it seems simpler, but it makes per-set tracking, historical comparisons, and auto-progression queries either impossible or horrifically slow.

**Why it happens:** Early prototypes store workouts as JSON blobs or simple exercise-weight-reps rows. The developer doesn't anticipate needing to query "show me all sets of bench press across all sessions sorted by date" or "find the session where the client first hit 15 reps on this exercise at this weight."

**Consequences:**
- Auto-progression logic (+2.5kg at 15+ reps) cannot reliably query previous set data
- Progress charts require full table scans or complex JSON parsing
- Changing a plan mid-cycle retroactively corrupts historical logs if logs reference plan structure rather than snapshotting it
- Eventual painful migration when the flat model can't support the features

**Prevention:**
- Design the data model FIRST around the hardest queries: per-set progress over time, auto-progression detection, and plan-vs-actual comparison
- Normalize: `training_plans` -> `plan_days` -> `plan_exercises` (prescribed) and `workout_sessions` -> `session_exercises` -> `exercise_sets` (logged)
- Snapshot prescribed values (target reps, target weight) into the log at the time of logging, so historical data survives plan changes
- Index on (client_id, exercise_id, logged_at) for progress chart queries

**Detection:** If you cannot write the auto-progression SQL query before building the UI, the model is wrong.

**Phase:** Must be addressed in Phase 1 (data model design). Retrofitting is extremely painful.

---

### Pitfall 2: Plan Mutation Corrupts History

**What goes wrong:** The trainer edits a training plan and the changes immediately overwrite the plan record. All historical workout logs that reference that plan now point to the new version, making it impossible to know what the client was *supposed* to do when they logged a past workout.

**Why it happens:** Developers model plans as mutable CRUD entities. Edit the plan, save it, done. They forget that the client's workout log from last Tuesday only makes sense in the context of what the plan prescribed *at that time*.

**Consequences:**
- Historical progress analysis is meaningless without knowing prescribed vs. actual
- Trainer cannot compare "what I assigned" vs "what they did" for past cycles
- The requirement "plan changes only take effect between training cycles" becomes impossible to enforce if plans are mutable in place

**Prevention:**
- Immutable plan versioning: each plan edit creates a new version. Old logs reference the old version.
- OR: Snapshot approach -- when a client starts a workout session, copy the prescribed exercises/sets/reps/weight into the session record. The session becomes self-contained.
- The snapshot approach is simpler for this project's scale. Each `workout_session` record stores the prescribed values alongside the actual logged values.
- Training cycle boundaries become: "activate new plan version at cycle start."

**Detection:** Ask: "If the trainer changes the plan today, can I still see what the client was prescribed last week?" If the answer is "no" or "it's complicated," the model is broken.

**Phase:** Phase 1 (data model). This is a design-time decision, not something you bolt on later.

---

### Pitfall 3: Gym-Floor UX Failure on Mobile Browsers

**What goes wrong:** The workout logging interface is designed for desktop or looks fine on a phone screen in a design tool, but is unusable in a real gym scenario: sweaty fingers on a small screen, one hand holding a phone, need to quickly log weight and reps between sets with a 60-90 second rest timer ticking.

**Why it happens:** Developers build CRUD forms -- text inputs for weight and reps, small buttons, lots of scrolling. They test sitting at a desk. They never test standing in a gym with one hand occupied.

**Consequences:**
- Clients stop logging workouts because it's too annoying, destroying the core value proposition
- Client retention drops because the "seamless training experience" is not seamless
- Trainer loses visibility into client progress

**Prevention:**
- Large touch targets (minimum 48px, ideally 56px+ for primary actions)
- Number inputs with stepper buttons (+/- 2.5kg increments, +/- 1 rep)
- Pre-fill with prescribed values or last session's values so the client only edits what changed
- Minimize scrolling: show only the current exercise's sets, not the entire workout
- One-tap "complete set as prescribed" for when the client hits exactly what was planned
- Test on actual phones in portrait mode with one thumb. If you can't log a set in under 5 seconds, iterate.
- `<input type="number" inputmode="decimal">` for proper mobile keyboard

**Detection:** Time how many taps/interactions it takes to log one set. If it's more than 3-4, it's too many.

**Phase:** Phase 2 (client workout logging UI). Get this right before adding progress charts or other features. If logging is painful, there's no data to chart.

---

### Pitfall 4: Anthropometric Measurement Data Entry Errors Without Validation

**What goes wrong:** The monthly body measurement form accepts any numeric input. A client or trainer enters 75 for a skinfold measurement (meant to type 7.5mm) or 1.75 for weight (meant 75kg). These outliers corrupt progress charts with wild spikes, making the charts useless.

**Why it happens:** Developers add number inputs and call it done. Anthropometric measurements have very specific valid ranges that most developers are not aware of.

**Consequences:**
- Progress charts become unreliable -- one bad data point makes the entire trend line meaningless
- Trainer loses trust in the data and stops using the feature
- Retroactive correction requires finding and editing old measurements, which most systems handle poorly

**Prevention:**
- Enforce reasonable ranges per measurement type:
  - Body weight: 30-250 kg
  - Height: 100-230 cm
  - Skinfold measurements: 2-60 mm (most sites)
  - Bone diameters: 3-12 cm
  - Circumferences: 15-150 cm (varies by site -- arm ~20-50, waist ~50-130, etc.)
- Show a confirmation warning for values that are technically in range but suspiciously different from the previous measurement (e.g., "Weight changed by 10kg since last month -- is this correct?")
- Allow editing of past measurements with an audit trail
- Display units prominently next to each field so the user knows if they're entering mm or cm

**Detection:** If the progress chart has any line that looks like an EKG (sharp spikes), you have a data validation problem.

**Phase:** Phase 2/3 (measurement form). Should be designed alongside the form, not added retroactively.

---

### Pitfall 5: YouTube Embed Brittleness

**What goes wrong:** The app stores YouTube URLs and renders them as embedded players. YouTube videos get deleted, made private, or have embedding disabled by the uploader. The exercise library fills up with broken video links over time, and the trainer doesn't know until a client reports it.

**Why it happens:** Developers treat YouTube links as static assets. They're not -- they're references to third-party content that can change or disappear at any time.

**Consequences:**
- Client sees a broken/blank video player where guidance should be, reducing trust in the app
- Trainer has to manually check all video links periodically
- If videos are embedded in an iframe, YouTube can block embedding for specific videos, showing an error instead

**Prevention:**
- Store YouTube video IDs, not full URLs. Parse the ID from whatever URL format the trainer pastes (youtube.com/watch?v=, youtu.be/, youtube.com/embed/).
- Use thumbnail-first display: show the YouTube thumbnail with a play button overlay. On click, open the video (either inline embed or link to YouTube). Thumbnails via `img.youtube.com/vi/{VIDEO_ID}/hqdefault.jpg` work even for some videos that block embedding.
- Add a periodic health check: the YouTube oEmbed API (`https://www.youtube.com/oembed?url=...`) returns 404 for deleted/private videos. Run this weekly or on-demand.
- Let the trainer flag/update broken videos easily from the exercise library management view.
- Consider opening YouTube links in a new tab rather than embedding, to avoid embed-blocked issues entirely. Simpler and more reliable.

**Detection:** More than 5% of exercise videos showing errors means the system needs a health check mechanism.

**Phase:** Phase 1 (exercise library). Parse and validate URLs at entry time. Add health checks in a later phase.

---

## Moderate Pitfalls

### Pitfall 6: Auto-Progression Logic That Doesn't Account for Real Training

**What goes wrong:** The auto-progression rule (15+ reps -> suggest +2.5kg) is implemented as a simple check on the last set logged. But real training is messier: a client might hit 15 reps on set 1, then 12 on set 2, then 10 on set 3 (fatigue). Or they might hit 15 on a day they felt great but normally do 10. A naive implementation suggests progression too aggressively or not at all.

**Why it happens:** The requirement sounds simple. Developers implement the literal rule without considering which set(s) the rule applies to, how many sessions should confirm the threshold, or edge cases.

**Prevention:**
- Clarify the rule with Javier before implementing: Does 15+ reps mean ALL sets in a session? The LAST set? Any set? Across multiple sessions?
- A safer default: suggest progression when the client hits 15+ reps on ALL prescribed sets for an exercise in a single session (or across 2 consecutive sessions for more conservative progression)
- Make the threshold configurable per exercise or globally (some exercises progress at different rates)
- The suggestion should be dismissable and not re-trigger for the same exercise/weight combo after being dismissed
- Show the suggestion to both the trainer (in their dashboard) and the client (at workout logging time)

**Detection:** If clients or the trainer complain that suggestions are "annoying" or "wrong," the logic is too naive.

**Phase:** Phase 3 (after basic workout logging works). Don't build this until you have real workout data flowing through the system.

---

### Pitfall 7: Bilingual Implementation as an Afterthought

**What goes wrong:** The app is built entirely in one language (usually English or Spanish) with strings hardcoded throughout components. Adding the second language later requires touching every single component to extract strings, restructure templates, and handle language switching.

**Why it happens:** i18n feels like overhead when you're trying to ship features. "We'll add Spanish later" turns into a multi-day refactor.

**Consequences:**
- Massive refactor to extract hardcoded strings
- Inconsistent translations (some screens translated, others not)
- Layout breaks because Spanish and English strings have different lengths
- Date/number formatting differences (Spain uses dd/mm/yyyy and comma decimals: 75,5 kg)

**Prevention:**
- Set up i18n infrastructure in the FIRST phase, before any UI is built. Use a library like react-i18next or next-intl from day one.
- Every user-facing string goes through the translation function from the start -- even if you only have one language initially, the extraction is done.
- Use Spanish as the primary language (it's the primary user base) and English as secondary.
- Handle locale-specific formatting: decimal separators (comma vs period for weights), date formats, measurement units.
- Keep translation files organized by feature/page, not one giant file.

**Detection:** If any component has a hardcoded user-facing string that doesn't go through i18n, it's technical debt accumulating.

**Phase:** Phase 1 (project setup). i18n scaffolding goes in at the beginning or it never goes in cleanly.

---

### Pitfall 8: Training Cycle Boundary Logic Is Underspecified

**What goes wrong:** The requirement says "plan changes only take effect between training cycles" but the system has no concept of what a cycle is, when it starts, or when it ends. Developers either skip this requirement or implement it as a fixed 4-week period, which doesn't match reality (cycles vary per client: 4, 6, or 8 weeks).

**Why it happens:** "Training cycle" is a domain concept that seems obvious to a trainer but is ambiguous in code. Does the trainer manually end a cycle? Is it calendar-based? Does it auto-end after N weeks?

**Consequences:**
- Plan changes take effect immediately, confusing clients mid-cycle
- OR plan changes never take effect because the cycle transition logic is broken
- Trainer has no visibility into "which cycle is this client on?"

**Prevention:**
- Model cycles explicitly: a `training_cycle` record per client with start_date, planned_end_date, actual_end_date, and plan_version_id
- The trainer manually starts a new cycle for each client (or the system suggests it based on planned_end_date)
- When a cycle is active, the client sees the plan version linked to that cycle
- When the trainer edits a plan during an active cycle, the edit is staged as a "draft" or "next cycle" version
- Keep it simple: trainer clicks "Start New Cycle" for a client, optionally with a new plan version. Don't over-automate.

**Detection:** Ask: "If I change a client's plan right now, what do they see?" If you can't answer clearly, cycle boundaries are underspecified.

**Phase:** Phase 2 (plan assignment and activation). Must be designed before clients start using plans.

---

### Pitfall 9: Progress Chart Performance with Growing Data

**What goes wrong:** Progress charts query all historical workout data for a client on every page load. With per-set logging (3-5 sets per exercise, 5-8 exercises per day, 3-5 days per week), a single client generates 45-200 set records per week. Over a year, that's 2,000-10,000 rows per client. For 50 clients, that's 100,000-500,000 rows. Unindexed queries or fetching all data to render a chart on the client side become slow.

**Why it happens:** With 5 test users and 50 rows, everything is fast. Developers don't test with realistic data volumes.

**Consequences:**
- Progress chart pages take 5+ seconds to load
- Database queries become the bottleneck
- Client-side chart libraries choke on large datasets

**Prevention:**
- Index workout set data on (client_id, exercise_id, performed_at)
- For charts, query aggregated data (max weight per exercise per session, average reps) rather than raw sets
- Consider pre-aggregating: a `progress_summary` table updated after each workout session with key metrics
- Use server-side date range filtering (default to last 3 months, let user expand)
- Paginate or limit the data points sent to the chart library (weekly or per-session aggregates, not individual sets)

**Detection:** Seed the database with 6 months of realistic data for 30 clients and test chart page load time. If it's over 2 seconds, optimize.

**Phase:** Phase 3 (progress charts). Design the query strategy when building charts, not after they're slow.

---

### Pitfall 10: Role-Based Access That's Too Coarse or Too Complex

**What goes wrong:** Either (a) the auth system has no role distinction and you realize a client can access trainer endpoints, or (b) the developer builds a full RBAC system with permissions, roles, and policies for what is fundamentally a two-role system (trainer + client).

**Why it happens:** Option (a): "I'll add auth later." Option (b): "What if we need more roles someday?" Both are wrong for this project.

**Consequences:**
- (a): Security breach -- clients viewing other clients' data, clients accessing trainer admin functions
- (b): Over-engineering that slows down every feature because everything goes through a permission layer

**Prevention:**
- Simple two-role model: `user.role` is either `trainer` or `client`. That's it.
- Middleware/guard at the route level: trainer routes check `role === 'trainer'`, client routes check `role === 'client'`
- Client data isolation: every client query includes `WHERE client_id = current_user.id` (or the trainer's query includes the client_id they selected)
- Do NOT build a permissions table, role hierarchy, or admin panel for role management. Javier is the only trainer. Hardcode it.
- One critical security check: a client must NEVER see another client's data. Test this explicitly.

**Detection:** Can you answer "what happens if a client manually navigates to /trainer/clients?" If the answer is "I don't know," you need route guards.

**Phase:** Phase 1 (auth setup). Route guards and role checks are trivial to add at the start and painful to retrofit.

---

## Minor Pitfalls

### Pitfall 11: Overbuilding the Exercise Library

**What goes wrong:** Developers build a complex exercise taxonomy with muscle groups, equipment tags, difficulty levels, search filters, and categorization -- when all the trainer needs is a list of exercise names with YouTube links that he can assign to plans.

**Prevention:**
- Exercise library v1: name, YouTube video ID, optional notes. That's it.
- The trainer knows his exercises. He doesn't need a search engine for 50-100 exercises.
- Add categories/tags only if Javier asks for them after using the basic version.
- No public exercise database integration (e.g., wger API) -- Javier curates his own library.

**Phase:** Phase 1. Keep it minimal.

---

### Pitfall 12: Client Self-Registration Without Trainer Approval Flow

**What goes wrong:** The registration form is publicly accessible. Random people sign up and appear in Javier's client list, or the system requires manual database edits to link a new client to the trainer.

**Prevention:**
- Registration should create an account but NOT grant access to a training plan until the trainer explicitly assigns/approves the client.
- Two approaches: (a) invite-link registration (trainer generates a link, only people with the link can register) or (b) open registration + trainer approval queue.
- Option (a) is simpler for 20-50 clients. Javier sends the link via WhatsApp.
- Either way, a newly registered client should see a "waiting for trainer to set up your plan" state, not an error or empty dashboard.

**Phase:** Phase 1 (auth/registration). This is a first-run experience issue.

---

### Pitfall 13: Ignoring the "Rest Between Sets" Workflow

**What goes wrong:** The workout logging UI treats each set as an isolated data entry moment. But the client's real workflow is: complete a set -> rest 60-120 seconds -> complete next set. The app doesn't accommodate this flow, so clients switch to another app (timer, music) and forget to come back to log.

**Prevention:**
- Consider showing a simple rest timer after logging a set (not mandatory, just visible)
- Keep the app on-screen between sets by making the current exercise view useful during rest (show previous sets, show what's next)
- Do NOT build a full-featured timer/stopwatch -- just a subtle countdown or elapsed time indicator
- Ensure the app doesn't require re-authentication or re-navigation after screen lock/unlock on mobile

**Phase:** Phase 2/3 (workout logging polish). Not MVP-critical, but significantly improves day-to-day usability.

---

### Pitfall 14: Decimal Handling for Weights Across Locales

**What goes wrong:** Spanish locale uses comma as decimal separator (72,5 kg). English uses period (72.5 kg). The app stores weights as strings or fails to parse "72,5" correctly, causing data corruption or NaN values in calculations.

**Prevention:**
- Store all weights as numeric types in the database (DECIMAL or FLOAT), never as strings
- Parse input: accept both comma and period as decimal separators regardless of locale
- Display according to the user's locale setting
- The +2.5kg auto-progression increment must use numeric arithmetic, not string concatenation
- Test with inputs: "72,5", "72.5", "72", "72,50" -- all should resolve to 72.5

**Phase:** Phase 1 (data layer). Handle this in the input parsing layer from the start.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Data model design | Flat workout model (Pitfall 1), mutable plans (Pitfall 2) | Design around hardest queries first. Snapshot prescribed values. |
| Auth & registration | Too coarse or complex access control (Pitfall 10), no approval flow (Pitfall 12) | Two roles, route guards, invite-link registration. |
| i18n setup | Afterthought bilingual (Pitfall 7), decimal handling (Pitfall 14) | i18n from day one, locale-aware number parsing from day one. |
| Exercise library | Overbuilding (Pitfall 11), YouTube brittleness (Pitfall 5) | Name + video ID + notes. Parse URLs, show thumbnails. |
| Workout logging UI | Gym-floor UX failure (Pitfall 3), ignoring rest flow (Pitfall 13) | Large touch targets, pre-filled values, minimal taps per set. |
| Body measurements | Data entry errors (Pitfall 4) | Range validation, outlier warnings, units displayed. |
| Training cycles | Underspecified boundaries (Pitfall 8) | Explicit cycle model, trainer-initiated transitions. |
| Auto-progression | Naive logic (Pitfall 6) | Clarify rule with trainer, check all sets, make configurable. |
| Progress charts | Performance with growing data (Pitfall 9) | Aggregate queries, date range defaults, proper indexing. |

---

## Sources

- Domain knowledge from fitness app development patterns (training data, MEDIUM confidence)
- YouTube oEmbed API documentation (well-established, HIGH confidence for that specific recommendation)
- Anthropometric measurement protocols and valid ranges (exercise science standards, MEDIUM confidence on specific ranges -- verify with Javier)
- Web search was unavailable; findings are based on training data. Recommend verification of specific library versions and API endpoints before implementation.
