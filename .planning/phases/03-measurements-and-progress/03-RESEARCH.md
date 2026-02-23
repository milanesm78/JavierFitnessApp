# Phase 3: Measurements and Progress - Research

**Researched:** 2026-02-23
**Domain:** Charting/data visualization, complex forms with validation, anthropometric measurement protocols, time-series data patterns
**Confidence:** MEDIUM-HIGH

## Summary

Phase 3 adds two major capabilities: (1) a comprehensive body measurement form following anthropometric protocol with ~25 fields across categories (weight, height, skin folds, bone diameters, circumferences), and (2) line chart visualizations for both body measurement trends and strength progress over time. The phase depends on Phase 2's workout logging data for strength charts.

The standard approach is **Recharts** for charting (declarative React components, built-in ResponsiveContainer, SVG-based) paired with **React Hook Form + Zod** for form handling and validation. The measurement form is the most complex form in the app: it has many numeric fields grouped into sections, each needing range validation specific to its measurement type. The charting requirement is straightforward -- line charts with date-based x-axes, one or more data series, responsive to mobile viewports.

**Primary recommendation:** Use Recharts for all charts (simple API, React-native components, built-in responsive support). Use React Hook Form with Zod schemas for the measurement form (type-safe validation, minimal re-renders with 25+ fields). Store measurements in a flat `body_measurements` table with one row per monthly session. Query strength progress by aggregating max weight per exercise from existing workout log data.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BODY-01 | Client can fill monthly body measurement form with full anthropometric protocol (weight, height, skin folds, bone diameters, circumferences) | React Hook Form with Zod schema handles multi-section form; field grouping via HTML fieldset pattern; measurement field catalog defined below |
| BODY-02 | Measurement form validates input ranges to prevent data entry errors | Zod schema with `.min()/.max()` per field; anthropometric range defaults provided in research; decimal precision handling with `.multipleOf(0.1)` |
| BODY-03 | Client and trainer can view measurement history | Standard table/list view; data from `body_measurements` table ordered by date; i18n date formatting via `toLocaleDateString()` |
| TRCK-01 | Client can view strength progress as line charts (weight per exercise over time) | Recharts LineChart with ResponsiveContainer; data from workout_logs aggregated as max weight per exercise per session; date-based XAxis |
| TRCK-02 | Client can view body measurement progress as line charts (measurements over time) | Recharts LineChart; data from `body_measurements` table; multiple series selectable by measurement type |
| TRCK-03 | Trainer can view any client's strength and body progress charts | Same chart components reused; trainer passes client_id parameter; RLS policy in Supabase allows trainer to read any client's data |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Recharts | ^3.7 | Line charts for strength and body measurement progress | Most React-native charting library; declarative component API; built-in ResponsiveContainer; SVG-based (accessible, crisp on all screens); ~1.1M weekly npm downloads |
| React Hook Form | ^7.71 | Body measurement form state management | Uncontrolled components minimize re-renders (critical with 25+ numeric fields); hooks-based API; 4KB gzipped; TypeScript-first |
| Zod | ^3.25 | Measurement form validation schemas | TypeScript-first schema validation; `.min()/.max()/.multipleOf()` perfect for numeric range validation; type inference eliminates dual type/validation maintenance |
| @hookform/resolvers | ^5.2 | Bridges Zod schemas to React Hook Form | Official integration; zodResolver connects Zod schemas to React Hook Form's validation pipeline |

**Note on Zod version:** Use Zod 3.25.x (the latest v3 line), NOT Zod 4.x. While Zod 4 exists (4.3.6), the @hookform/resolvers integration had compatibility issues with Zod v4 through mid-2025. The v3 line at 3.25.x includes the `/v4` subpath export for future migration but provides stable, battle-tested hookform integration. Verify compatibility at install time -- if @hookform/resolvers ^5.2.2+ explicitly supports Zod 4, upgrading is safe.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.x | Date formatting for chart axes and measurement dates | Lightweight (tree-shakable), functional API; use `format()` for chart tick labels, `parseISO()` for date parsing; already likely in project from Phase 1/2 i18n work |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | react-chartjs-2 (Chart.js wrapper) | Higher downloads (~2M/week) but canvas-based (harder to customize individual elements), less React-idiomatic API, requires imperative Chart.js configuration alongside React |
| Recharts | @nivo/line | Beautiful defaults, supports SVG/Canvas/HTML rendering, but much larger bundle size and only ~2K weekly downloads indicating smaller community |
| Zod | Yup | Yup was the original Formik companion; Zod is now the standard for TypeScript-first projects; Yup's type inference is weaker |
| React Hook Form | Formik | Formik uses controlled components causing more re-renders; 16KB vs 4KB; less actively maintained; React Hook Form is the modern standard |

**Installation:**
```bash
npm install recharts react-hook-form zod @hookform/resolvers date-fns
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── features/
│   ├── measurements/
│   │   ├── components/
│   │   │   ├── MeasurementForm.tsx          # Main form with sections
│   │   │   ├── MeasurementFormSection.tsx    # Reusable grouped fieldset
│   │   │   ├── MeasurementHistory.tsx        # Table/list of past measurements
│   │   │   └── NumericInput.tsx              # Shared numeric input (comma/period)
│   │   ├── schemas/
│   │   │   └── measurementSchema.ts          # Zod schema with all field validations
│   │   ├── hooks/
│   │   │   ├── useMeasurements.ts            # CRUD operations for measurements
│   │   │   └── useMeasurementHistory.ts      # Fetch measurement history
│   │   └── types/
│   │       └── measurement.ts                # TypeScript types (inferred from Zod)
│   └── progress/
│       ├── components/
│       │   ├── StrengthChart.tsx              # Line chart: weight per exercise over time
│       │   ├── MeasurementChart.tsx           # Line chart: body measurements over time
│       │   ├── ChartContainer.tsx             # Shared responsive wrapper
│       │   └── ChartControls.tsx              # Exercise/measurement selector, date range
│       ├── hooks/
│       │   ├── useStrengthProgress.ts         # Query workout logs for chart data
│       │   └── useMeasurementProgress.ts      # Query measurements for chart data
│       └── utils/
│           └── chartHelpers.ts                # Data transformation, color palette, formatters
```

### Pattern 1: Zod Schema with Grouped Measurement Validation

**What:** Define a single Zod schema that validates all anthropometric measurements with per-field min/max ranges, grouped by measurement category.
**When to use:** For the body measurement form (BODY-01, BODY-02).
**Example:**
```typescript
// Source: Zod official docs (zod.dev) + anthropometric protocol research
import { z } from 'zod';

// Reusable numeric field with range validation
const measurement = (min: number, max: number, precision: number = 0.1) =>
  z.number()
    .min(min, { message: `Must be at least ${min}` })
    .max(max, { message: `Must be at most ${max}` })
    .multipleOf(precision)
    .nullable()   // Allow null for optional measurements
    .optional();

// Required measurement (not nullable)
const requiredMeasurement = (min: number, max: number, precision: number = 0.1) =>
  z.number()
    .min(min, { message: `Must be at least ${min}` })
    .max(max, { message: `Must be at most ${max}` })
    .multipleOf(precision);

export const measurementSchema = z.object({
  measured_at: z.string().datetime(),

  // General
  weight: requiredMeasurement(20, 300, 0.1),       // kg
  height: requiredMeasurement(100, 250, 0.1),       // cm

  // Skin folds (mm) - caliper range is typically 0-60mm
  skinfold_triceps: measurement(2, 60),
  skinfold_subscapular: measurement(2, 60),
  skinfold_suprailiac: measurement(2, 60),
  skinfold_abdominal: measurement(2, 60),
  skinfold_thigh: measurement(2, 60),
  skinfold_calf: measurement(2, 60),

  // Bone diameters (cm)
  diameter_humeral: measurement(4, 10, 0.1),        // biepicondylar humerus
  diameter_femoral: measurement(6, 14, 0.1),         // biepicondylar femur
  diameter_bistyloidal: measurement(3, 8, 0.1),      // wrist

  // Circumferences (cm)
  circ_arm_relaxed: measurement(15, 60, 0.1),
  circ_arm_flexed: measurement(15, 65, 0.1),
  circ_chest: measurement(60, 150, 0.1),
  circ_waist: measurement(40, 150, 0.1),
  circ_hip: measurement(50, 160, 0.1),
  circ_thigh: measurement(30, 90, 0.1),
  circ_calf: measurement(20, 60, 0.1),
});

export type MeasurementFormData = z.infer<typeof measurementSchema>;
```

### Pattern 2: React Hook Form with Sectioned Layout

**What:** Use React Hook Form's `register()` with the Zod resolver, organizing inputs into visual fieldset sections.
**When to use:** Rendering the measurement form UI (BODY-01).
**Example:**
```typescript
// Source: React Hook Form docs (react-hook-form.com)
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { measurementSchema, type MeasurementFormData } from '../schemas/measurementSchema';

export function MeasurementForm({ onSubmit }: { onSubmit: (data: MeasurementFormData) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MeasurementFormData>({
    resolver: zodResolver(measurementSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Section: General */}
      <fieldset>
        <legend>{t('measurements.general')}</legend>
        <NumericInput label={t('weight')} unit="kg" {...register('weight', { valueAsNumber: true })} error={errors.weight} />
        <NumericInput label={t('height')} unit="cm" {...register('height', { valueAsNumber: true })} error={errors.height} />
      </fieldset>

      {/* Section: Skin Folds */}
      <fieldset>
        <legend>{t('measurements.skinFolds')}</legend>
        <NumericInput label={t('triceps')} unit="mm" {...register('skinfold_triceps', { valueAsNumber: true })} error={errors.skinfold_triceps} />
        {/* ... more skin fold fields */}
      </fieldset>

      {/* Section: Bone Diameters */}
      {/* Section: Circumferences */}
      {/* ... */}
    </form>
  );
}
```

### Pattern 3: Responsive Line Chart with Date Axis

**What:** Recharts LineChart wrapped in ResponsiveContainer with date-formatted x-axis.
**When to use:** All progress charts (TRCK-01, TRCK-02, TRCK-03).
**Example:**
```typescript
// Source: Recharts docs (recharts.github.io)
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface ChartDataPoint {
  date: string;   // ISO date string
  value: number;
}

interface ProgressChartProps {
  data: ChartDataPoint[];
  yLabel: string;
  color?: string;
  locale: 'es' | 'en';
}

export function ProgressChart({ data, yLabel, color = '#8884d8', locale }: ProgressChartProps) {
  const dateLocale = locale === 'es' ? es : enUS;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(dateStr) => format(parseISO(dateStr), 'MMM yyyy', { locale: dateLocale })}
        />
        <YAxis label={{ value: yLabel, angle: -90, position: 'insideLeft' }} />
        <Tooltip
          labelFormatter={(dateStr) => format(parseISO(dateStr as string), 'PPP', { locale: dateLocale })}
        />
        <Legend />
        <Line type="monotone" dataKey="value" stroke={color} dot={{ r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Pattern 4: Strength Progress Data Query

**What:** Aggregate workout log data to extract max weight per exercise per session for charting.
**When to use:** Strength progress charts (TRCK-01, TRCK-03).
**Example:**
```sql
-- Query: Max weight lifted per exercise per workout session
-- Source: PostgreSQL aggregation pattern for fitness data
SELECT
  ws.completed_at::date AS date,
  e.name AS exercise_name,
  MAX(wl.weight) AS max_weight
FROM workout_sets wl
JOIN workout_sessions ws ON wl.session_id = ws.id
JOIN exercises e ON wl.exercise_id = e.id
WHERE ws.client_id = $1
  AND e.id = $2
  AND ws.completed_at IS NOT NULL
GROUP BY ws.completed_at::date, e.name
ORDER BY date ASC;
```

```typescript
// Supabase RPC or view-based approach
const { data } = await supabase
  .rpc('get_strength_progress', {
    p_client_id: clientId,
    p_exercise_id: exerciseId,
  });
```

### Anti-Patterns to Avoid

- **Storing measurements as key-value pairs (EAV pattern):** Do NOT store measurements in a generic `measurement_type` + `measurement_value` table. Use a flat row with named columns. EAV makes queries complex, chart data transformation painful, and type safety impossible. With ~20 fixed measurement fields, a flat table is simpler and faster.
- **Re-rendering the entire form on each keystroke:** With 25+ fields, controlled components cause cascading re-renders. React Hook Form's uncontrolled approach avoids this. Do NOT use useState for each field.
- **Fetching all historical data for charts:** Always limit chart queries by date range. Even with 20-50 clients and monthly measurements, unbounded queries are a bad habit. Default to last 12 months.
- **Building a custom chart from scratch with SVG/Canvas:** Charting libraries handle hundreds of edge cases (responsive resizing, touch interactions, accessibility, tick label collision). Use Recharts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Line charts | Custom SVG/Canvas charting | Recharts `<LineChart>` | Responsive sizing, touch tooltips, axis formatting, legend, animation -- hundreds of edge cases |
| Form state with 25+ fields | Custom useState per field | React Hook Form `useForm()` | Re-render optimization, error tracking, dirty state, submit handling |
| Numeric range validation | Custom if/else chains | Zod schema `.min()/.max()` | Type inference, composable, i18n error messages, single source of truth |
| Date formatting for chart axes | Custom date string manipulation | date-fns `format()` | Locale support (es/en), timezone handling, edge cases (leap years, month boundaries) |
| Responsive chart container | CSS media queries + manual resize | Recharts `<ResponsiveContainer>` | Uses ResizeObserver internally, handles all resize edge cases |
| Decimal separator handling | Manual comma-to-period replacement | HTML `inputmode="decimal"` + `valueAsNumber` | Browser-native; `inputmode="decimal"` shows numeric keyboard on mobile with locale-appropriate separator |

**Key insight:** This phase has two deceptively complex domains -- charting and multi-field form validation. Both have well-solved library solutions. The measurement schema is the one thing that IS custom (because the field list and ranges are domain-specific), but the validation engine itself should not be.

## Common Pitfalls

### Pitfall 1: Decimal Separator Confusion
**What goes wrong:** Spanish-locale users enter "72,5" for weight but JavaScript parses it as NaN or "725".
**Why it happens:** `parseFloat()` only accepts period as decimal separator. Spanish convention uses comma.
**How to avoid:** Use `inputmode="decimal"` on `<input>` elements (shows appropriate keyboard on mobile). The app already has INFR-03 requiring comma and period support -- implement a `parseDecimalInput()` utility that normalizes comma to period before `parseFloat()`. Apply this in the Zod schema's `.transform()` or in a custom `setValueAs` in React Hook Form's `register()`.
**Warning signs:** NaN values in database, validation errors on valid-looking inputs from Spanish users.

### Pitfall 2: Empty Optional Fields Submitted as 0 Instead of null
**What goes wrong:** Optional measurement fields (e.g., a skin fold the client didn't measure this month) get submitted as `0` instead of `null`, skewing chart averages.
**Why it happens:** `valueAsNumber` converts empty string to `NaN`, but without careful handling, defaults or coercion may turn it to `0`.
**How to avoid:** In the Zod schema, use `.nullable().optional()` for optional fields. In the form, use a custom `setValueAs` function: `(v) => v === '' || isNaN(v) ? null : Number(v)`. Ensure chart queries filter out null values with `WHERE field IS NOT NULL`.
**Warning signs:** Charts showing sudden drops to 0, averages that seem too low.

### Pitfall 3: Chart Renders with No Data or Single Point
**What goes wrong:** Chart component crashes or shows an empty area when a client has 0 or 1 measurement records.
**Why it happens:** New clients won't have historical data. Line charts need at least 2 points to draw a line.
**How to avoid:** Always render an empty state message when data has fewer than 2 points. Check data length before rendering the chart: `{data.length >= 2 ? <LineChart ... /> : <EmptyState message={t('progress.needMoreData')} />}`.
**Warning signs:** Blank chart areas, console errors about undefined data.

### Pitfall 4: Strength Progress Chart Shows Confusing Data Points
**What goes wrong:** Chart shows multiple data points on the same date (multiple sessions) or weight fluctuations within a session (warm-up sets vs working sets).
**Why it happens:** Naive query returns every set's weight, not a meaningful summary.
**How to avoid:** Aggregate to MAX weight per exercise per session (represents best performance). If a client does two sessions on the same day, take the max across sessions for that date. The SQL query should GROUP BY date, not session.
**Warning signs:** Jagged charts with unrealistic drops, duplicate x-axis dates.

### Pitfall 5: Measurement Form UX is Overwhelming on Mobile
**What goes wrong:** 25+ fields in a single scrolling form is tedious and error-prone on a phone.
**Why it happens:** Desktop form design doesn't account for mobile thumb-scrolling fatigue.
**How to avoid:** Group fields into collapsible sections (General, Skin Folds, Bone Diameters, Circumferences). Show a progress indicator ("Section 2 of 4"). Use `inputmode="decimal"` to show numeric keyboard. Consider a stepper/wizard pattern on mobile, or at minimum, sticky section headers.
**Warning signs:** High form abandonment, partially submitted forms, user complaints.

### Pitfall 6: Chart Axis Labels Overlap on Small Screens
**What goes wrong:** Date labels on x-axis collide and become unreadable on mobile.
**Why it happens:** Recharts renders all tick labels by default; 12+ monthly data points don't fit in 320px width.
**How to avoid:** Use Recharts' `interval` prop on XAxis to skip labels (e.g., `interval="preserveStartEnd"` or calculate based on data length). Rotate labels with `angle={-45}` and `textAnchor="end"` if needed. Use shorter date format on mobile ("Jan" vs "January 2026").
**Warning signs:** Overlapping text on chart axes, illegible labels.

## Code Examples

Verified patterns from official sources:

### Numeric Input Component with Decimal Separator Support
```typescript
// Handles INFR-03: comma and period as decimal separators
// Source: Pattern derived from React Hook Form register() docs
import { forwardRef, type InputHTMLAttributes } from 'react';
import type { FieldError } from 'react-hook-form';

interface NumericInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  unit: string;
  error?: FieldError;
}

export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  ({ label, unit, error, ...props }, ref) => (
    <div className="numeric-input">
      <label>
        {label} ({unit})
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          {...props}
        />
      </label>
      {error && <span className="error">{error.message}</span>}
    </div>
  )
);
```

### Decimal Parsing Utility
```typescript
// Normalizes comma decimal separator to period for parsing
// Source: INFR-03 requirement + standard i18n pattern
export function parseDecimalInput(value: string | number | undefined | null): number | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  const normalized = String(value).replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
}
```

### Chart Data Transformation Helper
```typescript
// Transforms raw measurement rows into Recharts-compatible data
// Source: Recharts data format requirement (recharts.github.io)
interface MeasurementRow {
  measured_at: string;
  [key: string]: number | string | null;
}

export function toChartData(
  rows: MeasurementRow[],
  field: string
): { date: string; value: number }[] {
  return rows
    .filter((row) => row[field] != null)
    .map((row) => ({
      date: row.measured_at,
      value: row[field] as number,
    }));
}
```

### Multi-Series Strength Chart
```typescript
// Source: Recharts multi-line example pattern (recharts.github.io)
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

interface ExerciseProgress {
  date: string;
  [exerciseName: string]: number | string;
}

export function MultiExerciseChart({
  data,
  exercises,
  locale,
}: {
  data: ExerciseProgress[];
  exercises: string[];
  locale: 'es' | 'en';
}) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => new Date(d).toLocaleDateString(locale, { month: 'short' })}
        />
        <YAxis unit=" kg" />
        <Tooltip />
        <Legend />
        {exercises.map((name, i) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={COLORS[i % COLORS.length]}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

## Anthropometric Measurement Protocol

### Measurement Fields Catalog

This is the complete field list for the body measurement form, based on the ISAK anthropometric protocol referenced in PROJECT.md. Each field includes validation ranges derived from clinical anthropometric literature.

**Note:** Ranges below are generous defaults covering the general adult population (not just athletes). The blocker in STATE.md notes these should be confirmed with Javier before Phase 3 implementation. These defaults will prevent obvious data entry errors (e.g., typing 720 instead of 72.0) while accepting the full range of real human measurements.

| Category | Field | DB Column | Unit | Min | Max | Precision | Required |
|----------|-------|-----------|------|-----|-----|-----------|----------|
| General | Weight | `weight` | kg | 20 | 300 | 0.1 | Yes |
| General | Height | `height` | cm | 100 | 250 | 0.1 | Yes |
| Skin Fold | Triceps | `skinfold_triceps` | mm | 2 | 60 | 0.1 | No |
| Skin Fold | Subscapular | `skinfold_subscapular` | mm | 2 | 60 | 0.1 | No |
| Skin Fold | Suprailiac | `skinfold_suprailiac` | mm | 2 | 60 | 0.1 | No |
| Skin Fold | Abdominal | `skinfold_abdominal` | mm | 2 | 60 | 0.1 | No |
| Skin Fold | Thigh | `skinfold_thigh` | mm | 2 | 60 | 0.1 | No |
| Skin Fold | Calf | `skinfold_calf` | mm | 2 | 60 | 0.1 | No |
| Bone Diameter | Humeral biepicondylar | `diameter_humeral` | cm | 4 | 10 | 0.1 | No |
| Bone Diameter | Femoral biepicondylar | `diameter_femoral` | cm | 6 | 14 | 0.1 | No |
| Bone Diameter | Bistyloidal (wrist) | `diameter_bistyloidal` | cm | 3 | 8 | 0.1 | No |
| Circumference | Arm relaxed | `circ_arm_relaxed` | cm | 15 | 60 | 0.1 | No |
| Circumference | Arm flexed | `circ_arm_flexed` | cm | 15 | 65 | 0.1 | No |
| Circumference | Chest | `circ_chest` | cm | 60 | 150 | 0.1 | No |
| Circumference | Waist | `circ_waist` | cm | 40 | 150 | 0.1 | No |
| Circumference | Hip | `circ_hip` | cm | 50 | 160 | 0.1 | No |
| Circumference | Thigh | `circ_thigh` | cm | 30 | 90 | 0.1 | No |
| Circumference | Calf | `circ_calf` | cm | 20 | 60 | 0.1 | No |

**Range rationale:**
- **Skin folds (2-60mm):** Standard calipers measure up to 45-60mm. Minimum of 2mm accounts for very lean individuals. The 50th percentile for athletic populations is ~8-12mm per site; higher values occur in general population.
- **Bone diameters:** Based on anthropometric literature. Humeral biepicondylar averages ~6-7cm (males) and ~5-6cm (females). Ranges extended to accommodate outliers.
- **Circumferences:** Ranges cover from very small adults to bodybuilders. Waist 40-150cm covers underweight to obese range.
- **Weight (20-300kg) and Height (100-250cm):** Extremely generous to prevent false rejections while catching order-of-magnitude errors.

### Database Schema

```sql
-- Body measurements table: one row per measurement session
CREATE TABLE body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id),
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- General
  weight DECIMAL(5,1) NOT NULL,       -- kg (20.0 - 300.0)
  height DECIMAL(4,1) NOT NULL,       -- cm (100.0 - 250.0)

  -- Skin folds (mm)
  skinfold_triceps DECIMAL(4,1),
  skinfold_subscapular DECIMAL(4,1),
  skinfold_suprailiac DECIMAL(4,1),
  skinfold_abdominal DECIMAL(4,1),
  skinfold_thigh DECIMAL(4,1),
  skinfold_calf DECIMAL(4,1),

  -- Bone diameters (cm)
  diameter_humeral DECIMAL(3,1),
  diameter_femoral DECIMAL(3,1),
  diameter_bistyloidal DECIMAL(3,1),

  -- Circumferences (cm)
  circ_arm_relaxed DECIMAL(4,1),
  circ_arm_flexed DECIMAL(4,1),
  circ_chest DECIMAL(4,1),
  circ_waist DECIMAL(4,1),
  circ_hip DECIMAL(4,1),
  circ_thigh DECIMAL(4,1),
  circ_calf DECIMAL(4,1),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT weight_range CHECK (weight BETWEEN 20 AND 300),
  CONSTRAINT height_range CHECK (height BETWEEN 100 AND 250)
);

-- Index for querying a client's measurement history
CREATE INDEX idx_measurements_client_date ON body_measurements(client_id, measured_at DESC);

-- RLS: clients see own data, trainer sees all
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients read own measurements"
  ON body_measurements FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients insert own measurements"
  ON body_measurements FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Trainer reads all measurements"
  ON body_measurements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'trainer'
    )
  );
```

### Strength Progress Database Function

```sql
-- Function: Get strength progress for a specific exercise
-- Returns max weight per date for chart rendering
CREATE OR REPLACE FUNCTION get_strength_progress(
  p_client_id UUID,
  p_exercise_id UUID,
  p_from_date DATE DEFAULT (now() - INTERVAL '12 months')::date,
  p_to_date DATE DEFAULT now()::date
)
RETURNS TABLE(date DATE, max_weight DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ws.completed_at::date AS date,
    MAX(wsets.weight) AS max_weight
  FROM workout_sets wsets
  JOIN workout_sessions ws ON wsets.session_id = ws.id
  WHERE ws.client_id = p_client_id
    AND wsets.exercise_id = p_exercise_id
    AND ws.completed_at IS NOT NULL
    AND ws.completed_at::date BETWEEN p_from_date AND p_to_date
  GROUP BY ws.completed_at::date
  ORDER BY date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Formik + Yup for forms | React Hook Form + Zod | 2022-2023 shift | Smaller bundle, fewer re-renders, TypeScript-first type inference |
| Moment.js for date formatting | date-fns or dayjs | 2020 (Moment deprecated) | Tree-shakable, immutable, smaller bundle |
| Chart.js with jQuery-style config | Recharts declarative React components | 2016+ but accelerated 2022-2024 | React-idiomatic composition, no imperative API |
| EAV (Entity-Attribute-Value) for flexible measurements | Flat column schema with nullable fields | Always preferred for known schemas | Type safety, simpler queries, better performance |
| Zod v3 | Zod v4 with @zod/mini | August 2025 | 14x faster string parsing, 2KB mini bundle; BUT hookform resolver compatibility still maturing -- use v3.25.x for stability |

**Deprecated/outdated:**
- **Moment.js**: Officially deprecated since 2020; replaced by date-fns or dayjs
- **Formik**: Still works but considered legacy; React Hook Form is the standard for new projects
- **Recharts v2**: Recharts v3 is current; v2 had performance issues with large datasets

## Open Questions

1. **Exact skin fold sites Javier uses**
   - What we know: PROJECT.md lists "~6-8 skin fold sites (triceps, subscapular, suprailiac, abdominal, thigh, calf)" and bone diameters (humeral, femoral, bistyloidal)
   - What's unclear: Whether Javier measures all 6 skin fold sites or a subset; whether he measures biceps or supraspinal (ISAK includes 8 sites)
   - Recommendation: Build the form with all 6 listed sites as optional fields. If Javier wants to add biceps or supraspinal, it's a single column addition. The flexible nullable schema supports this.

2. **Measurement validation ranges confirmation**
   - What we know: Ranges defined above are based on anthropometric literature and clinical caliper specifications
   - What's unclear: Whether Javier's client population has tighter expected ranges that would catch more errors
   - Recommendation: Ship with the generous defaults above. Add a configuration mechanism (or just constants in the schema file) so Javier can tighten ranges later based on experience.

3. **Workout log table names from Phase 2**
   - What we know: Phase 2 implements WLOG-01 through WLOG-04 (per-set workout logging)
   - What's unclear: Exact table/column names for workout sessions and sets (Phase 2 hasn't been planned yet)
   - Recommendation: The strength progress query pattern above uses `workout_sessions` and `workout_sets` as assumed names. The planner should align these with Phase 2's actual schema when planning Phase 3.

4. **Whether to calculate body fat percentage from skin folds**
   - What we know: ANAL-02 in v2 requirements says "Body fat percentage calculated from skin fold measurements" -- this is explicitly deferred to v2
   - What's unclear: N/A -- it's clearly out of scope for v1
   - Recommendation: Do NOT implement body fat calculation in Phase 3. Store raw skin fold values only. The v2 feature can add calculated fields later.

## Sources

### Primary (HIGH confidence)
- [Recharts official docs](https://recharts.github.io/en-US/) - ResponsiveContainer API, LineChart examples, XAxis configuration
- [React Hook Form official docs](https://react-hook-form.com/) - useForm API, register with valueAsNumber, zodResolver integration
- [Zod official docs](https://zod.dev/) - Schema definition, .min()/.max()/.multipleOf()/.nullable(), TypeScript inference
- [npm: recharts](https://www.npmjs.com/package/recharts) - Version 3.7.0, weekly downloads
- [npm: react-hook-form](https://www.npmjs.com/package/react-hook-form) - Version 7.71.2
- [npm: zod](https://www.npmjs.com/package/zod) - Version 3.25.x (v3 line) and 4.3.6 (v4 line)
- [npm: @hookform/resolvers](https://www.npmjs.com/package/@hookform/resolvers) - Version 5.2.2, Zod v4 compatibility notes

### Secondary (MEDIUM confidence)
- [ISAK anthropometric protocol](https://pmc.ncbi.nlm.nih.gov/articles/PMC10975034/) - 8 skinfold sites, measurement precision standards
- [Topendsports skinfold ratings](https://www.topendsports.com/testing/tests/skinfolds.htm) - Sum of 7 sites rating table for males/females
- [DAPA Measurement Toolkit](https://dapa-toolkit.mrc.ac.uk/anthropometry/objective-methods/simple-measures-skinfolds) - Skinfold site descriptions, caliper specifications
- [CDC Anthropometric Reference Data](https://www.cdc.gov/nchs/data/nhsr/nhsr010.pdf) - Population reference data for US adults
- [LogRocket React Chart Libraries 2025](https://blog.logrocket.com/best-react-chart-libraries-2025/) - Ecosystem comparison, download numbers
- [Supabase TimescaleDB docs](https://supabase.com/docs/guides/database/extensions/timescaledb) - Time-series patterns (concluded: not needed at this scale)
- [GitHub: hookform/resolvers Zod v4 issues](https://github.com/react-hook-form/resolvers/issues/799) - Compatibility status between Zod v4 and resolvers

### Tertiary (LOW confidence)
- Bone diameter ranges (humeral 4-10cm, femoral 6-14cm, bistyloidal 3-8cm) derived from limited anthropometric literature and may need tightening after real-world usage
- Circumference ranges based on general population data, not fitness-specific populations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Recharts, React Hook Form, and Zod are clearly dominant in their categories with strong npm adoption, active maintenance, and React ecosystem alignment
- Architecture: HIGH - Flat measurement table, grouped form sections, and responsive chart patterns are well-established and verified against multiple sources
- Pitfalls: MEDIUM-HIGH - Decimal separator and empty field handling are well-documented issues; chart edge cases come from practical React charting experience
- Measurement ranges: MEDIUM - Based on anthropometric literature and caliper specifications, but not validated against Javier's specific client population (known blocker in STATE.md)

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (30 days -- stable domain, libraries well-established)
