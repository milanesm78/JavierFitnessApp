-- =============================================================================
-- JavierFitness Phase 2: Core Training Loop Schema
-- =============================================================================
-- Creates the training plan, workout logging, and dashboard data layer.
-- Includes immutable plan versioning, RLS policies for trainer/client
-- isolation, RPC functions for plan versioning and dashboard, and
-- performance indexes.
--
-- Run this migration via Supabase SQL Editor or `supabase db push`.
-- Depends on: 00001_initial_schema.sql (profiles, user_roles, exercises)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Helper function: is_trainer()
-- -----------------------------------------------------------------------------
-- Checks if the current JWT user has the 'trainer' role.
-- SECURITY DEFINER avoids RLS on the profiles join.
-- Uses (SELECT auth.jwt()) for initPlan caching optimization.

CREATE OR REPLACE FUNCTION public.is_trainer()
RETURNS BOOLEAN AS $$
  SELECT (SELECT auth.jwt()->>'user_role') = 'trainer'
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 2. Training Plans table (immutable versioning)
-- -----------------------------------------------------------------------------
-- Each row is ONE VERSION of a plan for one client.
-- Editing a plan creates a NEW row, not an UPDATE.

CREATE TABLE public.training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_group_id UUID NOT NULL,
  version INT NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  cycle_length_weeks INT NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

COMMENT ON TABLE public.training_plans IS 'Immutable plan versions. Each edit creates a new row with incremented version.';
COMMENT ON COLUMN public.training_plans.plan_group_id IS 'Groups versions together (same plan lineage)';
COMMENT ON COLUMN public.training_plans.status IS 'draft -> active -> archived. Only one active plan per client at a time.';

-- CONSTRAINT: Only one active plan per client at a time
CREATE UNIQUE INDEX idx_one_active_plan_per_client
  ON public.training_plans (client_id) WHERE status = 'active';

-- -----------------------------------------------------------------------------
-- 3. Training Days table
-- -----------------------------------------------------------------------------
-- Training days belong to a specific plan version.

CREATE TABLE public.training_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.training_plans(id) ON DELETE CASCADE NOT NULL,
  day_label TEXT NOT NULL,
  day_order INT NOT NULL,
  UNIQUE(plan_id, day_order)
);

COMMENT ON TABLE public.training_days IS 'Training days within a plan version (Day A, Day B, etc.)';

-- -----------------------------------------------------------------------------
-- 4. Plan Exercises table
-- -----------------------------------------------------------------------------
-- Exercises prescribed within a training day (specific to a plan version).

CREATE TABLE public.plan_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_day_id UUID REFERENCES public.training_days(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) NOT NULL,
  exercise_order INT NOT NULL,
  prescribed_sets INT NOT NULL,
  prescribed_reps INT NOT NULL,
  prescribed_weight_kg DECIMAL(6,2) NOT NULL,
  UNIQUE(training_day_id, exercise_order)
);

COMMENT ON TABLE public.plan_exercises IS 'Exercise prescriptions within a training day. References exercise library.';

-- -----------------------------------------------------------------------------
-- 5. Workout Sessions table
-- -----------------------------------------------------------------------------
-- Tracks when a client starts and completes a workout for a training day.

CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  training_day_id UUID REFERENCES public.training_days(id) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.workout_sessions IS 'Workout sessions referencing a specific training day version for immutability';

-- -----------------------------------------------------------------------------
-- 6. Workout Sets table
-- -----------------------------------------------------------------------------
-- Individual set logs reference a specific plan_exercise (preserving exact prescription).

CREATE TABLE public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE NOT NULL,
  plan_exercise_id UUID REFERENCES public.plan_exercises(id) NOT NULL,
  set_number INT NOT NULL,
  weight_kg DECIMAL(6,2) NOT NULL,
  reps INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, plan_exercise_id, set_number)
);

COMMENT ON TABLE public.workout_sets IS 'Individual set logs within a workout session. References specific plan_exercise for immutability.';

-- -----------------------------------------------------------------------------
-- 7. Performance Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX idx_training_plans_client_status ON public.training_plans(client_id, status);
CREATE INDEX idx_training_days_plan_id ON public.training_days(plan_id);
CREATE INDEX idx_plan_exercises_day_id ON public.plan_exercises(training_day_id);
CREATE INDEX idx_workout_sessions_client_id ON public.workout_sessions(client_id);
CREATE INDEX idx_workout_sessions_day_id ON public.workout_sessions(training_day_id);
CREATE INDEX idx_workout_sessions_started_at ON public.workout_sessions(started_at);
CREATE INDEX idx_workout_sets_session_id ON public.workout_sets(session_id);

-- -----------------------------------------------------------------------------
-- 8. Enable Row Level Security on ALL Phase 2 tables
-- -----------------------------------------------------------------------------

ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 9. RLS Policies for training_plans
-- -----------------------------------------------------------------------------
-- Clients see own plans; Trainer sees all, inserts, and updates.

CREATE POLICY "Clients view own plans"
  ON public.training_plans FOR SELECT TO authenticated
  USING (client_id = (SELECT auth.uid()));

CREATE POLICY "Trainer views all plans"
  ON public.training_plans FOR SELECT TO authenticated
  USING (public.is_trainer());

CREATE POLICY "Trainer inserts plans"
  ON public.training_plans FOR INSERT TO authenticated
  WITH CHECK (public.is_trainer());

CREATE POLICY "Trainer updates plans"
  ON public.training_plans FOR UPDATE TO authenticated
  USING (public.is_trainer())
  WITH CHECK (public.is_trainer());

-- -----------------------------------------------------------------------------
-- 10. RLS Policies for training_days
-- -----------------------------------------------------------------------------
-- Clients see own training days (via plan ownership); Trainer has full access.

CREATE POLICY "Clients view own training days"
  ON public.training_days FOR SELECT TO authenticated
  USING (
    plan_id IN (
      SELECT id FROM public.training_plans WHERE client_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Trainer selects training days"
  ON public.training_days FOR SELECT TO authenticated
  USING (public.is_trainer());

CREATE POLICY "Trainer inserts training days"
  ON public.training_days FOR INSERT TO authenticated
  WITH CHECK (public.is_trainer());

CREATE POLICY "Trainer updates training days"
  ON public.training_days FOR UPDATE TO authenticated
  USING (public.is_trainer())
  WITH CHECK (public.is_trainer());

CREATE POLICY "Trainer deletes training days"
  ON public.training_days FOR DELETE TO authenticated
  USING (public.is_trainer());

-- -----------------------------------------------------------------------------
-- 11. RLS Policies for plan_exercises
-- -----------------------------------------------------------------------------
-- Clients see own plan exercises (via training_day -> plan ownership);
-- Trainer has full access.

CREATE POLICY "Clients view own plan exercises"
  ON public.plan_exercises FOR SELECT TO authenticated
  USING (
    training_day_id IN (
      SELECT td.id FROM public.training_days td
      JOIN public.training_plans tp ON td.plan_id = tp.id
      WHERE tp.client_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Trainer selects plan exercises"
  ON public.plan_exercises FOR SELECT TO authenticated
  USING (public.is_trainer());

CREATE POLICY "Trainer inserts plan exercises"
  ON public.plan_exercises FOR INSERT TO authenticated
  WITH CHECK (public.is_trainer());

CREATE POLICY "Trainer updates plan exercises"
  ON public.plan_exercises FOR UPDATE TO authenticated
  USING (public.is_trainer())
  WITH CHECK (public.is_trainer());

CREATE POLICY "Trainer deletes plan exercises"
  ON public.plan_exercises FOR DELETE TO authenticated
  USING (public.is_trainer());

-- -----------------------------------------------------------------------------
-- 12. RLS Policies for workout_sessions
-- -----------------------------------------------------------------------------
-- Clients manage own sessions; Trainer views all.
-- Separate policies per operation for clients (not FOR ALL for mixed roles).

CREATE POLICY "Clients select own sessions"
  ON public.workout_sessions FOR SELECT TO authenticated
  USING (client_id = (SELECT auth.uid()));

CREATE POLICY "Clients insert own sessions"
  ON public.workout_sessions FOR INSERT TO authenticated
  WITH CHECK (client_id = (SELECT auth.uid()));

CREATE POLICY "Clients update own sessions"
  ON public.workout_sessions FOR UPDATE TO authenticated
  USING (client_id = (SELECT auth.uid()))
  WITH CHECK (client_id = (SELECT auth.uid()));

CREATE POLICY "Clients delete own sessions"
  ON public.workout_sessions FOR DELETE TO authenticated
  USING (client_id = (SELECT auth.uid()));

CREATE POLICY "Trainer views all sessions"
  ON public.workout_sessions FOR SELECT TO authenticated
  USING (public.is_trainer());

-- -----------------------------------------------------------------------------
-- 13. RLS Policies for workout_sets
-- -----------------------------------------------------------------------------
-- Clients manage own sets (via session ownership); Trainer views all.

CREATE POLICY "Clients select own sets"
  ON public.workout_sets FOR SELECT TO authenticated
  USING (
    session_id IN (
      SELECT id FROM public.workout_sessions WHERE client_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Clients insert own sets"
  ON public.workout_sets FOR INSERT TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.workout_sessions WHERE client_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Clients update own sets"
  ON public.workout_sets FOR UPDATE TO authenticated
  USING (
    session_id IN (
      SELECT id FROM public.workout_sessions WHERE client_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.workout_sessions WHERE client_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Clients delete own sets"
  ON public.workout_sets FOR DELETE TO authenticated
  USING (
    session_id IN (
      SELECT id FROM public.workout_sessions WHERE client_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Trainer views all sets"
  ON public.workout_sets FOR SELECT TO authenticated
  USING (public.is_trainer());

-- -----------------------------------------------------------------------------
-- 14. RPC Function: create_plan_version (deep copy)
-- -----------------------------------------------------------------------------
-- Creates a new plan version by deep-copying an existing plan with all
-- training days and plan exercises. Increments version, sets status='draft'.

CREATE OR REPLACE FUNCTION public.create_plan_version(source_plan_id UUID)
RETURNS UUID AS $$
DECLARE
  new_plan_id UUID;
  source_plan public.training_plans%ROWTYPE;
  day_record RECORD;
  new_day_id UUID;
BEGIN
  -- Get source plan
  SELECT * INTO source_plan FROM public.training_plans WHERE id = source_plan_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source plan not found: %', source_plan_id;
  END IF;

  -- Create new plan version
  INSERT INTO public.training_plans (client_id, plan_group_id, version, name, cycle_length_weeks, status)
  VALUES (
    source_plan.client_id,
    source_plan.plan_group_id,
    source_plan.version + 1,
    source_plan.name,
    source_plan.cycle_length_weeks,
    'draft'
  ) RETURNING id INTO new_plan_id;

  -- Copy training days and their exercises
  FOR day_record IN SELECT * FROM public.training_days WHERE plan_id = source_plan_id ORDER BY day_order
  LOOP
    INSERT INTO public.training_days (plan_id, day_label, day_order)
    VALUES (new_plan_id, day_record.day_label, day_record.day_order)
    RETURNING id INTO new_day_id;

    INSERT INTO public.plan_exercises (training_day_id, exercise_id, exercise_order,
                                       prescribed_sets, prescribed_reps, prescribed_weight_kg)
    SELECT new_day_id, exercise_id, exercise_order,
           prescribed_sets, prescribed_reps, prescribed_weight_kg
    FROM public.plan_exercises WHERE training_day_id = day_record.id
    ORDER BY exercise_order;
  END LOOP;

  RETURN new_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 15. RPC Function: activate_plan_version (atomic transition)
-- -----------------------------------------------------------------------------
-- Archives current active plan for the same client and activates the new plan.
-- Atomic transaction ensures no gap in plan availability.

CREATE OR REPLACE FUNCTION public.activate_plan_version(new_plan_id UUID)
RETURNS VOID AS $$
DECLARE
  target_client_id UUID;
  target_status TEXT;
BEGIN
  -- Get the client and status of the plan to activate
  SELECT client_id, status INTO target_client_id, target_status
  FROM public.training_plans WHERE id = new_plan_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found: %', new_plan_id;
  END IF;

  IF target_status <> 'draft' THEN
    RAISE EXCEPTION 'Can only activate draft plans. Current status: %', target_status;
  END IF;

  -- Archive current active plan (if any)
  UPDATE public.training_plans
  SET status = 'archived', archived_at = now()
  WHERE client_id = target_client_id AND status = 'active';

  -- Activate the new plan
  UPDATE public.training_plans
  SET status = 'active', activated_at = now()
  WHERE id = new_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 16. RPC Function: get_client_dashboard
-- -----------------------------------------------------------------------------
-- Returns client list with activity status, plan status, and today's workout
-- status for the trainer dashboard. Uses LATERAL JOINs for efficiency.

CREATE OR REPLACE FUNCTION public.get_client_dashboard()
RETURNS TABLE (
  client_id UUID,
  full_name TEXT,
  email TEXT,
  status TEXT,
  has_active_plan BOOLEAN,
  today_workout_status TEXT,
  last_workout_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS client_id,
    p.full_name,
    p.email,
    CASE
      WHEN p.is_active = false THEN 'pending'
      WHEN ws_recent.last_workout IS NULL THEN 'inactive'
      WHEN ws_recent.last_workout < now() - INTERVAL '7 days' THEN 'inactive'
      ELSE 'active'
    END AS status,
    (tp.id IS NOT NULL) AS has_active_plan,
    CASE
      WHEN ws_today.completed_at IS NOT NULL THEN 'completed'
      WHEN ws_today.id IS NOT NULL THEN 'in_progress'
      ELSE 'not_started'
    END AS today_workout_status,
    ws_recent.last_workout AS last_workout_at
  FROM public.profiles p
  LEFT JOIN public.training_plans tp ON tp.client_id = p.id AND tp.status = 'active'
  LEFT JOIN LATERAL (
    SELECT MAX(ws.started_at) AS last_workout
    FROM public.workout_sessions ws
    WHERE ws.client_id = p.id
  ) ws_recent ON TRUE
  LEFT JOIN LATERAL (
    SELECT ws.id, ws.completed_at
    FROM public.workout_sessions ws
    WHERE ws.client_id = p.id
      AND ws.started_at::DATE = CURRENT_DATE
    ORDER BY ws.started_at DESC
    LIMIT 1
  ) ws_today ON TRUE
  WHERE p.role = 'client'::public.user_role
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
