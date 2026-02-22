# Feature Landscape

**Domain:** Fitness coaching platform (personal trainer managing 20-50 clients)
**Researched:** 2026-02-21
**Confidence:** MEDIUM (based on training data knowledge of TrueCoach, TrainHeroic, Trainerize, My PT Hub, FitSW, PTminder, and general fitness SaaS patterns; web search unavailable for 2026-specific verification)

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Trainer portal with client list** | Every coaching platform has this. Javier needs a dashboard showing all clients at a glance with status indicators. | Low | Entry point for all trainer actions. |
| **Client portal with personal dashboard** | Clients expect to log in and immediately see their plan, next workout, and recent progress. TrueCoach, Trainerize all do this. | Medium | Must feel personal -- "my plan", not generic. |
| **Exercise library with video links** | Standard across all platforms (TrueCoach has built-in video, Trainerize integrates YouTube). Clients need to see HOW to perform exercises. | Low | YouTube embed/link is the right call -- avoids hosting costs. Library should be searchable and categorizable. |
| **Personalized training plans** | The core product. Trainer builds a plan per client, organized by training days. Every competitor does this. | High | Most complex feature. Must handle: exercises per day, sets/reps/weight prescription, plan templates, and cycle management. |
| **Per-set workout logging** | Clients log weight and reps for each set. This is standard in TrueCoach, TrainHeroic, and every serious coaching app. Casual apps (like MyFitnessPal) skip this, but coaching platforms do not. | Medium | UX is critical here -- logging must be fast and frictionless on mobile browser. Tap-heavy interfaces kill compliance. |
| **Progress charts (strength)** | Clients and trainers expect to see weight/reps trending upward over time per exercise. TrueCoach, TrainHeroic all provide this. | Medium | Line charts per exercise. Must handle: exercise changes across cycles, deload weeks, missed sessions. |
| **Progress charts (body measurements)** | Visual proof that the program works. Weight, circumferences, skin folds over time. Standard in coaching platforms with body composition focus. | Medium | Line charts. The anthropometric protocol (skin folds, bone diameters, circumferences) is more detailed than most platforms offer -- this crosses into differentiator territory. |
| **Responsive mobile web** | Clients log workouts at the gym on their phones. If the web app is not usable on mobile, it is dead on arrival. | Medium | Not a "feature" per se, but a hard requirement. Every interaction must work on a 375px-wide screen. |
| **Bilingual (Spanish/English)** | Javier's client base is in Spain. Spanish is required. English is a nice default. | Low-Medium | i18n from day one -- retrofitting is painful. Use a standard i18n library, not string concatenation. |
| **Authentication (trainer vs client roles)** | Two distinct login experiences with role-based access. Standard for any multi-user platform. | Medium | Trainer sees all clients. Client sees only their own data. Role-based routing. |
| **Client registration/management** | Trainer needs to add clients, clients self-register with email. Trainer assigns/activates them. | Low-Medium | Keep it simple: email-based auth, trainer approval or invite flow. |

## Differentiators

Features that set this product apart. Not expected by users, but valued when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Auto-progression suggestions** | When client hits 15+ reps, app suggests +2.5kg. Most platforms leave progression entirely to the trainer. This is a smart coaching assist -- reduces trainer workload and keeps clients progressing. | Medium | Must be a suggestion, not automatic. Show a visual indicator on the trainer's view ("Client X ready for progression on Bench Press"). Client sees it too but trainer confirms. |
| **Detailed anthropometric tracking** | Most fitness apps track weight and maybe waist circumference. Javier's protocol includes 6-8 skin fold sites, bone diameters, and multiple circumferences. This is sports-science-grade body composition tracking -- rare in coaching platforms. | Medium | The measurement form is complex (many fields). Good UX: group by body region, allow partial entry, show which measurements are due. |
| **Training cycle management** | Plans change between cycles, not mid-cycle. Cycle length varies per client (4-8 weeks). Most platforms treat plans as "current plan" with no cycle concept -- the trainer just overwrites. Having explicit cycle boundaries enables: comparing cycles, tracking periodization, and preventing mid-cycle disruption. | High | This is architecturally significant. A "cycle" is a first-class entity: start date, end date, associated plan version. Plan edits during a cycle are staged for next cycle. |
| **Workout completion visibility for trainer** | Trainer sees at a glance which clients completed today's workout, who is behind, who has not logged in days. Most platforms have this but it is often buried. Making it prominent on the trainer dashboard is a retention tool. | Low-Medium | Color-coded client cards: green (completed today), yellow (partially done), red (no activity in 3+ days). |
| **Exercise-level YouTube video embedding** | Not just a link to a video, but an inline player that shows the exercise demonstration right in the workout logging screen. Reduces friction: client does not leave the app to watch form guidance. | Low | YouTube iframe embed. Simple technically, but significant UX improvement over a plain link that opens a new tab. |

## Anti-Features

Features to explicitly NOT build. These add complexity without proportional value for this specific use case.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **In-app payments/billing** | Explicitly out of scope. Javier handles payments via cash and Bizum. Building billing adds massive complexity (Stripe integration, invoicing, tax compliance in Spain) for zero value. | Note in the UI: "Contact your trainer for billing questions." |
| **Real-time chat/messaging** | Out of scope. Adds WebSocket complexity, notification infrastructure, moderation concerns. Javier already communicates with clients via WhatsApp. | Link to WhatsApp or display trainer contact info in the client portal. |
| **Push notifications/reminders** | Out of scope. Requires service workers, notification permissions, and ongoing engagement engineering. The product should retain through value, not nagging. | None needed. The dashboard itself is the "reminder" -- clients check it when they go to the gym. |
| **Multi-trainer support** | Javier is the only trainer. Building multi-tenancy now adds complexity to every query, every permission check, every UI element. | Single-trainer architecture. If needed later, the data model can be extended (add trainer_id FK), but do not build the UI or auth for it now. |
| **Native mobile app** | Web app only. Building React Native or Flutter doubles the codebase and deployment complexity. A well-built responsive web app covers the use case. | PWA-like features (add to home screen, offline caching of current plan) are worth considering as a lightweight alternative, but not a native app. |
| **Social features (leaderboards, community feed)** | Javier has 20-50 clients. Social features need critical mass to feel alive. A feed with 3 posts per week feels dead. Also raises privacy concerns -- not all clients want their progress visible. | Keep it private: each client sees only their own data. |
| **Nutrition tracking/meal plans** | Massive feature scope (food databases, macro calculators, meal planning). Separate domain entirely. If Javier wants nutrition, he can use MyFitnessPal alongside this app. | Do not build. Optionally link to external nutrition tools. |
| **AI-generated workout plans** | Tempting but dangerous. Javier's value is his expertise in programming. Auto-generating plans undermines his role and could produce unsafe recommendations. The auto-progression suggestion is the right level of AI assistance. | Keep AI limited to progression suggestions. Javier builds all plans manually. |
| **Wearable device integration** | Fitbit, Apple Watch, Garmin integrations are complex (OAuth flows, different APIs, data normalization). Low value for a strength-training-focused platform. | Manual logging is fine. Clients are already in the gym with their phone. |
| **Complex periodization modeling** | Block periodization, DUP, wave loading calculators. Over-engineering for the use case. Javier knows his periodization; the app just needs to let him prescribe what he wants. | Simple plan structure: days with exercises, each exercise has sets/reps/weight. The trainer is the intelligence, not the software. |

## Feature Dependencies

```
Authentication ──> Client Registration ──> Client Dashboard
                                       ──> Trainer Dashboard

Exercise Library ──> Training Plans ──> Workout Logging ──> Strength Progress Charts
                                    ──> Training Cycle Management

Client Registration ──> Body Measurements Form ──> Body Measurement Progress Charts

Training Plans ──> Auto-Progression Suggestions (requires workout logging history)

Bilingual (i18n) ──> All UI components (must be built into foundation, not retrofitted)
```

### Dependency Notes

1. **Exercise Library must exist before Training Plans** -- plans reference exercises. Build the library first or concurrently with plans.
2. **Workout Logging requires Training Plans** -- a client logs against their prescribed plan. No plan = nothing to log.
3. **Progress Charts require logged data** -- charts are meaningless without historical workout logs and measurements. Build logging first, charts second.
4. **Auto-Progression requires workout history** -- the system needs multiple sessions of data to detect when a client consistently hits 15+ reps. This is a later-phase feature.
5. **i18n must be foundational** -- every string in the app goes through the i18n system from day one. Adding i18n after the fact means touching every component.
6. **Training Cycle Management depends on Training Plans** -- cycles are a wrapper around plan versions. Build basic plans first, then add cycle semantics.

## MVP Recommendation

### Phase 1: Foundation (build first)
1. Authentication with trainer/client roles
2. Client registration and management
3. Exercise library (trainer CRUD, searchable, with YouTube links)
4. i18n infrastructure (Spanish + English from day one)

### Phase 2: Core Training Loop (the product)
1. Training plan builder (trainer creates plans per client, organized by day)
2. Client workout view (see today's exercises with embedded YouTube videos)
3. Per-set workout logging (weight + reps per set)
4. Trainer dashboard with client completion status

### Phase 3: Progress and Body Composition
1. Monthly body measurement form (full anthropometric protocol)
2. Strength progress charts (weight/reps per exercise over time)
3. Body measurement progress charts (measurements over time)

### Phase 4: Smart Features
1. Training cycle management (cycle boundaries, plan versioning between cycles)
2. Auto-progression suggestions (detect 15+ rep threshold, suggest weight increase)

### Defer Indefinitely
- Everything in the Anti-Features list
- Multi-trainer support (only if Javier hires other trainers)
- Native mobile app (only if responsive web proves insufficient)

### Rationale for This Order
- **Phase 1 before Phase 2**: Cannot build plans without exercises; cannot build anything without auth and i18n.
- **Phase 2 before Phase 3**: The workout logging loop is the core product. Measurements are important but secondary to daily workout engagement.
- **Phase 3 before Phase 4**: Progress visualization motivates clients. Smart features (cycles, auto-progression) are optimization layers on top of a working product.
- **Auto-progression last**: Requires accumulated workout data to be meaningful. Ship logging first, let data accumulate, then add intelligence.

## Competitive Landscape Context

**Confidence: MEDIUM** (based on training data, not live verification)

| Platform | Strengths (Relevant to Javier) | Weaknesses (Opportunities for Javier) |
|----------|-------------------------------|---------------------------------------|
| **TrueCoach** | Clean workout delivery, video integration, client compliance tracking | Expensive per-client pricing ($), English-only, no detailed anthropometric tracking |
| **Trainerize** | Large feature set, integrations, client app | Over-featured for a solo trainer, complex UI, subscription cost |
| **TrainHeroic** | Great for strength athletes, per-set logging, progress tracking | Team/gym focused, not ideal for solo personal trainer workflow |
| **My PT Hub** | Good trainer tools, client management | Dated UI, limited body composition tracking |
| **FitSW** | Simple plan building, exercise library | Basic progress tracking, limited customization |

**Javier's app advantages over these platforms:**
1. **Free** -- no per-client subscription fees (self-hosted)
2. **Spanish-first** -- most platforms are English-only or poorly localized
3. **Deep anthropometric tracking** -- sports-science-grade body composition, not just weight
4. **Custom to his workflow** -- no features he does not need, exactly the features he does
5. **Cycle-aware** -- explicit training cycle management with plan versioning

## Sources

- Training data knowledge of fitness coaching platforms (TrueCoach, Trainerize, TrainHeroic, My PT Hub, FitSW, PTminder) -- MEDIUM confidence
- PROJECT.md requirements and constraints -- HIGH confidence (direct project context)
- General SaaS product development patterns -- HIGH confidence
- Fitness industry domain knowledge (periodization, anthropometrics, coaching workflows) -- MEDIUM confidence

**Note:** Web search was unavailable during this research session. Competitive landscape details should be verified against current platform offerings before making final product decisions. Feature categorizations are based on established patterns in the fitness coaching SaaS space as of early 2025 training data.
