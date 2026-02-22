# Technology Stack

**Project:** JavierFitness -- Personal Training Coaching Platform
**Researched:** 2026-02-21
**Overall Confidence:** MEDIUM (versions based on training data through May 2025; verify exact latest versions before initializing project)

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | ^15.x | Full-stack React framework | App Router with Server Components gives us server-rendered pages for SEO-irrelevant but performance-critical dashboards, API routes co-located with UI, built-in middleware for auth guards between trainer/client portals, and i18n routing for Spanish/English. The file-based routing maps cleanly to the two-portal structure (`/trainer/*`, `/client/*`). Vercel deployment is zero-config. | MEDIUM |
| React | ^19.x | UI library | Ships with Next.js 15. React 19 brings Server Components as stable, `use()` hook for data fetching, improved form handling with `useActionState` and `useFormStatus` -- directly useful for workout logging forms and measurement input. | MEDIUM |
| TypeScript | ^5.x | Type safety | Non-negotiable for a data-heavy app with workout logs, measurement records, and training plans. TypeScript catches shape mismatches between DB schemas and UI components at build time. | HIGH |

### Backend-as-a-Service

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase | Latest (JS client ^2.x) | Database, Auth, API | PostgreSQL under the hood gives us relational integrity for the deeply relational data model (trainers -> clients -> plans -> days -> exercises -> sets -> logs). Row Level Security (RLS) handles the two-portal access model natively -- clients can only see their own data, trainer sees everything. Built-in auth with email/password (no social login needed). Real-time subscriptions available if needed later. Generous free tier handles 20-50 users easily. | HIGH |
| PostgreSQL | 15+ (via Supabase) | Primary database | The data model is inherently relational: training plans reference exercises, workout logs reference plan prescriptions, measurements belong to clients over time. NoSQL would be fighting the data shape. Supabase provides managed Postgres with automatic REST and GraphQL APIs. | HIGH |

### Styling and UI Components

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | ^3.4+ or ^4.x | Utility-first CSS | Fast to build responsive layouts. The app needs to work well on mobile browsers (clients log workouts at the gym on their phones). Tailwind's mobile-first responsive classes make this straightforward. No design system overhead for a single-developer project. | HIGH |
| shadcn/ui | Latest | Component library | Not a dependency -- it copies components into your codebase. Built on Radix UI primitives (accessible, keyboard-navigable). Provides data tables for trainer's client list, forms for measurement input, dialogs for exercise details, charts integration. Fully customizable since you own the code. | HIGH |
| Recharts | ^2.x | Progress charts | Line charts for body measurements over time and strength progression. Recharts is React-native, composable, and handles the specific chart types needed (line charts with multiple series, tooltips, responsive sizing). Lighter than Chart.js for this use case. | MEDIUM |

### Internationalization

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| next-intl | ^3.x | i18n for Next.js App Router | Purpose-built for Next.js App Router. Handles message catalogs (Spanish/English), locale routing (`/es/*`, `/en/*`), date/number formatting (European comma decimals for Spanish users). Simpler than react-i18next for Next.js-specific patterns like server component translations. | MEDIUM |

### Form Handling and Validation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React Hook Form | ^7.x | Form state management | The app is form-heavy: workout logging (weight + reps per set, multiple sets per exercise, multiple exercises per session), body measurement entry (~20 fields), training plan builder. React Hook Form handles complex nested forms performantly with minimal re-renders. | HIGH |
| Zod | ^3.x | Schema validation | Shared validation between client forms and server actions. Define measurement ranges once (e.g., weight 20-300kg, skin fold 2-80mm), validate on both sides. TypeScript inference from Zod schemas eliminates type duplication. | HIGH |

### Authentication

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase Auth | Included with Supabase | Email/password auth | Two user roles needed: trainer and client. Supabase Auth handles email/password registration, session management, and JWT tokens. Role differentiation via a `role` column in a `profiles` table, enforced by RLS policies. No need for OAuth/social -- clients register with email, trainer has a single admin account. | HIGH |

### Deployment and Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vercel | N/A | Hosting | First-party Next.js hosting. Free tier supports the traffic level (20-50 users). Automatic preview deployments, edge functions, analytics. Zero-config deployment from Git. | HIGH |
| Supabase Cloud | Free tier | Database hosting | Managed Postgres, auth, and storage. Free tier: 500MB database, 1GB storage, 50K monthly active users. More than sufficient for 20-50 clients. Hosted in EU regions available (relevant for Spanish user base / GDPR). | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| date-fns | ^3.x or ^4.x | Date manipulation | Training cycle calculations, measurement date formatting, workout log timestamps. Tree-shakeable (only import what you use). Supports locale formatting for Spanish dates. | MEDIUM |
| @tanstack/react-query | ^5.x | Server state management | Cache and sync Supabase data. Handles loading/error states, background refetching when client returns to app at the gym, optimistic updates for workout logging. | MEDIUM |
| nuqs | ^2.x | URL search params state | Filter/sort state in trainer's client list, exercise library search, progress chart date ranges. Keeps UI state in URL for shareability and back-button support. | LOW |
| lucide-react | Latest | Icons | Consistent icon set that pairs with shadcn/ui. Exercise types, navigation, status indicators. | HIGH |
| @supabase/ssr | ^0.x | Supabase SSR helpers | Cookie-based auth for Next.js server components and middleware. Required for proper Supabase + Next.js App Router integration. | MEDIUM |
| embla-carousel-react | ^8.x | Carousel/swipe | Optional: swipeable training day cards on mobile. Only if UX testing shows it's needed. | LOW |

### Development Tools

| Tool | Version | Purpose | Why | Confidence |
|------|---------|---------|-----|------------|
| ESLint | ^9.x | Linting | Flat config (ESLint 9+). Catches bugs, enforces consistency. Next.js ships with eslint-config-next. | MEDIUM |
| Prettier | ^3.x | Code formatting | Consistent code style. Integrates with ESLint via eslint-config-prettier. | HIGH |
| Supabase CLI | Latest | Local development | Run Postgres locally, test RLS policies, generate TypeScript types from DB schema, manage migrations. Essential for the Supabase workflow. | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js | Remix | Remix is excellent but smaller ecosystem, fewer hosting options with zero config. Next.js has larger community, more tutorials, better Vercel integration. For a solo developer, ecosystem size matters for finding solutions fast. |
| Framework | Next.js | Vite + React SPA | No server-side rendering, no API routes co-located, would need a separate backend. Next.js gives full-stack in one project. |
| Backend | Supabase | Firebase | Firebase uses NoSQL (Firestore) which fights the relational data model. Querying "all sets for exercise X across all clients for the last 3 months" is painful in NoSQL. PostgreSQL handles this naturally. |
| Backend | Supabase | Custom Express/Fastify API | Massively more work for a single developer. Auth, database connections, API design, deployment -- Supabase provides all of this out of the box. Save the custom backend for when you outgrow Supabase (you won't at 50 users). |
| Backend | Supabase | Prisma + PlanetScale | More moving parts. Prisma ORM adds a layer between you and SQL. Supabase's auto-generated APIs + RLS is simpler for this scale. |
| Styling | Tailwind CSS | CSS Modules | More verbose, slower to iterate. No responsive utility classes. Tailwind's constraint-based system produces more consistent designs faster. |
| Styling | Tailwind CSS | Chakra UI / MUI | Heavy runtime, opinionated design language that fights customization. shadcn/ui + Tailwind gives component primitives without the framework lock-in. |
| Components | shadcn/ui | Radix UI directly | shadcn/ui is built on Radix but adds pre-styled, copy-paste components. Starting from raw Radix means styling everything from scratch. |
| Charts | Recharts | Chart.js (react-chartjs-2) | Chart.js is canvas-based (not React-native), harder to customize with React patterns. Recharts is SVG-based, composable with React components. |
| Charts | Recharts | D3.js | Massive overkill. D3 is for custom visualizations. We need standard line charts. Recharts provides these with 10x less code. |
| Charts | Recharts | Tremor | Tremor is excellent but tightly coupled to its own design system. Recharts is more flexible for custom chart styling. |
| i18n | next-intl | react-i18next | react-i18next works but requires more boilerplate for Next.js App Router. next-intl is purpose-built for this setup. |
| i18n | next-intl | next-translate | Less actively maintained, smaller community. next-intl has better App Router support. |
| Forms | React Hook Form | Formik | Formik re-renders the entire form on every change. React Hook Form uses uncontrolled inputs by default -- critical for the workout logging form where users are rapidly entering numbers for multiple sets. |
| Date | date-fns | Moment.js | Moment is deprecated and not tree-shakeable (67KB gzipped for the whole library). date-fns imports only what you use. |
| Date | date-fns | Day.js | Day.js is lighter but date-fns has better TypeScript support and the locale formatting needed for Spanish dates. Either would work; date-fns is marginally better for this use case. |
| State | TanStack Query | SWR | Both are excellent. TanStack Query has more features for complex caching, mutation handling, and devtools. The workout logging flow benefits from optimistic updates which TanStack Query handles more explicitly. |
| Hosting | Vercel | Netlify | Netlify works but Next.js support is second-class compared to Vercel (who builds Next.js). Edge middleware, ISR, and server actions work best on Vercel. |
| Hosting | Vercel | Self-hosted (VPS) | Unnecessary complexity for 20-50 users. Docker, nginx, SSL, monitoring -- all solved by Vercel's free tier. |

## What NOT to Use

| Technology | Why Avoid |
|------------|-----------|
| Redux / Zustand | No complex client state to manage. Server state handled by TanStack Query. Form state handled by React Hook Form. URL state handled by nuqs. Adding a state management library is unnecessary complexity. |
| tRPC | Adds a layer of abstraction over Supabase's auto-generated API. If you were writing a custom backend, tRPC would be excellent. With Supabase, it's redundant. |
| Drizzle / Prisma ORM | Supabase's client SDK and raw SQL migrations handle everything. Adding an ORM between Supabase and your app creates two sources of truth for the schema. Use Supabase's TypeScript type generation instead. |
| Tailwind UI (paid) | The free shadcn/ui components cover every pattern this app needs. Don't pay for Tailwind UI templates when shadcn/ui is free and more flexible. |
| NextAuth.js (Auth.js) | Supabase Auth handles everything. Adding NextAuth creates conflicting session management. Use `@supabase/ssr` for Next.js auth integration. |
| GraphQL (Apollo, urql) | Supabase provides a REST API and a PostgREST auto-generated API. GraphQL adds complexity without benefit at this scale. If you need complex queries, write them as Postgres functions and call them via Supabase RPC. |
| Framer Motion | Animations are nice but not a priority for a utility-focused fitness app. CSS transitions handle the basics. Add Framer Motion later only if UX testing reveals a need. |
| Storybook | Overkill for a single-developer project with 20-50 users. Build components in-context. Add Storybook if the team grows. |

## Database Schema Direction

Since Supabase is PostgreSQL, the schema should leverage relational integrity heavily:

```
profiles (id, email, role, full_name, locale, created_at)
exercises (id, name, youtube_url, muscle_group, notes, created_at)
training_plans (id, client_id, name, cycle_length_weeks, is_active, starts_at, created_at)
training_days (id, plan_id, day_number, name)
plan_exercises (id, training_day_id, exercise_id, order, prescribed_sets, prescribed_reps, prescribed_weight_kg)
workout_sessions (id, client_id, training_day_id, started_at, completed_at)
workout_logs (id, session_id, plan_exercise_id, set_number, weight_kg, reps, created_at)
body_measurements (id, client_id, measured_at, weight_kg, height_cm, triceps_sf, subscapular_sf, suprailiac_sf, abdominal_sf, thigh_sf, calf_sf, humeral_diameter, femoral_diameter, bistyloidal_diameter, arm_circ, chest_circ, waist_circ, hip_circ, thigh_circ, calf_circ)
```

Row Level Security policies:
- Clients: SELECT/INSERT on their own workout_logs, workout_sessions, body_measurements. SELECT on their own training plans, exercises (all).
- Trainer (role = 'trainer'): Full CRUD on everything.

## Installation

```bash
# Initialize Next.js project with TypeScript and Tailwind
npx create-next-app@latest javier-fitness --typescript --tailwind --eslint --app --src-dir

# Core dependencies
npm install @supabase/supabase-js @supabase/ssr

# UI components (shadcn/ui is installed via CLI, not npm)
npx shadcn@latest init
npx shadcn@latest add button card dialog form input label select table tabs toast chart

# Form handling and validation
npm install react-hook-form @hookform/resolvers zod

# Data fetching and caching
npm install @tanstack/react-query

# Charts
npm install recharts

# Internationalization
npm install next-intl

# Date utilities
npm install date-fns

# Icons (included with shadcn/ui but explicit)
npm install lucide-react

# URL state management (optional, add when needed)
npm install nuqs

# Dev dependencies
npm install -D supabase prettier eslint-config-prettier
```

## Version Verification Notice

**IMPORTANT:** The version numbers above are based on training data through May 2025. Before initializing the project, verify current stable versions:

```bash
# Run these to confirm latest versions
npm view next version
npm view react version
npm view @supabase/supabase-js version
npm view @tanstack/react-query version
npm view recharts version
npm view next-intl version
npm view react-hook-form version
npm view zod version
npm view date-fns version
npm view tailwindcss version
```

If Next.js 16 or React 20 have been released, check their changelogs for breaking changes before adopting. Prefer latest stable over latest cutting-edge.

## Key Technical Decisions Rationale

### Why Supabase over a custom backend?

This project has 20-50 users and one developer. The entire backend -- auth, database, API, file storage, real-time -- is provided by Supabase's free tier. Building a custom Express API would triple development time with zero user-facing benefit. When (if) the app outgrows Supabase, the PostgreSQL database can be exported and the API layer replaced. The data model is the asset, not the API framework.

### Why Next.js App Router over Pages Router?

App Router is the current standard. Server Components reduce client-side JavaScript (important for mobile gym users on spotty connections). Server Actions simplify form submissions (workout logging). Middleware handles auth guards cleanly. The learning curve is worth it because this is a greenfield project with no legacy code.

### Why shadcn/ui over a traditional component library?

You own the code. When Javier says "make the workout logging buttons bigger for sweaty gym fingers," you modify a file you own. With MUI or Chakra, you fight the library's opinions. shadcn/ui gives you accessible, well-structured starting points that you fully control.

### Why Recharts for charts?

The app needs exactly two chart types: line charts for body measurements over time, and line charts for strength progression (weight x reps per exercise over time). Recharts handles both with composable React components, responsive sizing, and tooltips. No need for D3-level power or Chart.js canvas rendering.

## Sources

- Next.js documentation (nextjs.org/docs) -- App Router, Server Components, Server Actions, Middleware, i18n
- Supabase documentation (supabase.com/docs) -- Auth, RLS, TypeScript generation, SSR helpers
- shadcn/ui documentation (ui.shadcn.com) -- Component catalog, installation, theming
- Recharts documentation (recharts.org) -- LineChart, ResponsiveContainer, composable API
- next-intl documentation (next-intl-docs.vercel.app) -- App Router integration, message catalogs
- React Hook Form documentation (react-hook-form.com) -- Performance, resolver integration with Zod
- TanStack Query documentation (tanstack.com/query) -- Caching, mutations, optimistic updates

**Note:** Version numbers are from training data (May 2025 cutoff). All sources are well-established projects unlikely to have undergone breaking architectural changes, but exact version numbers should be verified via npm before project initialization.
