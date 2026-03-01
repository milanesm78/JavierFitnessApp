-- =============================================================================
-- JavierFitness Phase 4: Auto-Progression Suggestions Schema
-- =============================================================================
-- Creates the progression detection and suggestion lifecycle data layer.
-- Includes progression_suggestions table, detection RPC, accept/dismiss RPCs,
-- RLS policies, and per-exercise increment support.
--
-- Run this migration via Supabase SQL Editor or `supabase db push`.
-- Depends on: 00002_training_loop_schema.sql (plan_exercises, workout_sessions,
--             workout_sets, is_trainer() helper)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Add per-exercise progression increment to exercises table
-- -----------------------------------------------------------------------------
-- Default NULL means 2.5kg is used via COALESCE pattern.
-- Trainer can optionally set per-exercise increments (e.g., +5kg for deadlifts,
-- +1.25kg for lateral raises).

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS progression_increment_kg DECIMAL(4,2) DEFAULT NULL;

COMMENT ON COLUMN public.exercises.progression_increment_kg
  IS 'Optional per-exercise weight increment for auto-progression. NULL defaults to 2.5kg.';

-- -----------------------------------------------------------------------------
-- 2. Progression status enum
-- -----------------------------------------------------------------------------

CREATE TYPE public.progression_status AS ENUM ('pending', 'accepted', 'dismissed');

-- -----------------------------------------------------------------------------
-- 3. Progression suggestions table
-- -----------------------------------------------------------------------------

CREATE TABLE public.progression_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.profiles(id),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  plan_exercise_id UUID NOT NULL REFERENCES public.plan_exercises(id),
  current_weight_kg DECIMAL(6,2) NOT NULL,
  suggested_weight_kg DECIMAL(6,2) NOT NULL,
  triggered_by_session_id UUID NOT NULL REFERENCES public.workout_sessions(id),
  status public.progression_status NOT NULL DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.progression_suggestions
  IS 'Auto-progression suggestions with pending/accepted/dismissed lifecycle.';

-- -----------------------------------------------------------------------------
-- 4. Partial index for fast pending lookup
-- -----------------------------------------------------------------------------

CREATE INDEX idx_progression_pending
  ON public.progression_suggestions(client_id, status)
  WHERE status = 'pending';

-- -----------------------------------------------------------------------------
-- 5. Enable Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.progression_suggestions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 6. RLS Policies (separate per operation, never FOR ALL)
-- -----------------------------------------------------------------------------

-- SELECT: Client sees own suggestions, trainer sees all
CREATE POLICY "Clients view own suggestions"
  ON public.progression_suggestions FOR SELECT
  TO authenticated
  USING (
    client_id = (SELECT auth.uid())
    OR public.is_trainer()
  );

-- INSERT: Only authenticated users can insert for themselves (RPC runs as invoker)
CREATE POLICY "System inserts suggestions"
  ON public.progression_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (client_id = (SELECT auth.uid()));

-- UPDATE: Client or trainer can resolve; WITH CHECK constrains to accepted/dismissed
CREATE POLICY "Client or trainer resolves suggestions"
  ON public.progression_suggestions FOR UPDATE
  TO authenticated
  USING (
    client_id = (SELECT auth.uid())
    OR public.is_trainer()
  )
  WITH CHECK (
    status IN ('accepted', 'dismissed')
  );

-- No DELETE policy: suggestions are never deleted, only status-transitioned

-- -----------------------------------------------------------------------------
-- 7. RPC Function: check_progression_eligibility
-- -----------------------------------------------------------------------------
-- Detects exercises where the client logged 15+ reps at prescribed weight
-- and creates pending suggestions with per-exercise increment support.
-- Includes warm-up filtering and re-suggestion cooldown (3 sessions).

CREATE OR REPLACE FUNCTION public.check_progression_eligibility(p_session_id UUID)
RETURNS SETOF public.progression_suggestions
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  rec RECORD;
  existing_pending UUID;
  dismissed_suggestion RECORD;
  sessions_since_dismissal INT;
BEGIN
  -- Find exercises in this session where any set had 15+ reps at prescribed weight
  FOR rec IN
    SELECT DISTINCT
      ws.client_id,
      pe.exercise_id,
      pe.id AS plan_exercise_id,
      pe.prescribed_weight_kg,
      e.progression_increment_kg
    FROM public.workout_sets wsets
    JOIN public.workout_sessions ws ON ws.id = wsets.session_id
    JOIN public.plan_exercises pe ON pe.id = wsets.plan_exercise_id
    JOIN public.exercises e ON e.id = pe.exercise_id
    WHERE wsets.session_id = p_session_id
      AND wsets.reps >= 15
      -- Warm-up filter: only evaluate sets at or above prescribed weight
      AND wsets.weight_kg >= pe.prescribed_weight_kg
  LOOP
    -- Check if a pending suggestion already exists for this exercise + weight
    SELECT id INTO existing_pending
    FROM public.progression_suggestions
    WHERE client_id = rec.client_id
      AND exercise_id = rec.exercise_id
      AND current_weight_kg = rec.prescribed_weight_kg
      AND status = 'pending';

    -- Skip if pending suggestion already exists
    IF existing_pending IS NOT NULL THEN
      CONTINUE;
    END IF;

    -- Check for dismissed suggestion cooldown (re-suggest after 3 sessions)
    SELECT id, created_at INTO dismissed_suggestion
    FROM public.progression_suggestions
    WHERE client_id = rec.client_id
      AND exercise_id = rec.exercise_id
      AND current_weight_kg = rec.prescribed_weight_kg
      AND status = 'dismissed'
    ORDER BY created_at DESC
    LIMIT 1;

    IF dismissed_suggestion.id IS NOT NULL THEN
      -- Count completed sessions since the dismissal
      SELECT COUNT(*) INTO sessions_since_dismissal
      FROM public.workout_sessions
      WHERE client_id = rec.client_id
        AND completed_at IS NOT NULL
        AND started_at > dismissed_suggestion.created_at;

      -- Only re-suggest if 3+ sessions have been completed since dismissal
      IF sessions_since_dismissal < 3 THEN
        CONTINUE;
      END IF;
    END IF;

    -- Create new suggestion with per-exercise increment (default 2.5kg)
    RETURN QUERY
    INSERT INTO public.progression_suggestions (
      client_id,
      exercise_id,
      plan_exercise_id,
      current_weight_kg,
      suggested_weight_kg,
      triggered_by_session_id,
      status
    ) VALUES (
      rec.client_id,
      rec.exercise_id,
      rec.plan_exercise_id,
      rec.prescribed_weight_kg,
      rec.prescribed_weight_kg + COALESCE(rec.progression_increment_kg, 2.5),
      p_session_id,
      'pending'
    )
    RETURNING *;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.check_progression_eligibility(UUID)
  IS 'Detects exercises with 15+ reps at prescribed weight and creates pending progression suggestions.';

-- -----------------------------------------------------------------------------
-- 8. RPC Function: accept_progression_suggestion
-- -----------------------------------------------------------------------------
-- Atomically accepts a suggestion: updates plan_exercises weight and marks
-- the suggestion as accepted. Includes stale check to prevent weight reduction.

CREATE OR REPLACE FUNCTION public.accept_progression_suggestion(p_suggestion_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  suggestion RECORD;
  current_prescribed DECIMAL(6,2);
BEGIN
  -- Get and lock the suggestion
  SELECT * INTO suggestion
  FROM public.progression_suggestions
  WHERE id = p_suggestion_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suggestion not found or already resolved';
  END IF;

  -- Stale check: verify plan_exercises weight still matches
  SELECT prescribed_weight_kg INTO current_prescribed
  FROM public.plan_exercises
  WHERE id = suggestion.plan_exercise_id;

  IF current_prescribed IS DISTINCT FROM suggestion.current_weight_kg THEN
    -- Weight has changed since suggestion was created; auto-dismiss as stale
    UPDATE public.progression_suggestions
    SET status = 'dismissed',
        resolved_at = now(),
        resolved_by = (SELECT auth.uid())
    WHERE id = p_suggestion_id;
    RAISE EXCEPTION 'Suggestion is stale: prescribed weight has changed from % to %',
      suggestion.current_weight_kg, current_prescribed;
  END IF;

  -- Update the plan exercise weight
  UPDATE public.plan_exercises
  SET prescribed_weight_kg = suggestion.suggested_weight_kg
  WHERE id = suggestion.plan_exercise_id;

  -- Mark suggestion as accepted
  UPDATE public.progression_suggestions
  SET status = 'accepted',
      resolved_at = now(),
      resolved_by = (SELECT auth.uid())
  WHERE id = p_suggestion_id;
END;
$$;

COMMENT ON FUNCTION public.accept_progression_suggestion(UUID)
  IS 'Atomically accepts a suggestion: updates plan weight and marks accepted. Stale suggestions are auto-dismissed.';

-- -----------------------------------------------------------------------------
-- 9. RPC Function: dismiss_progression_suggestion
-- -----------------------------------------------------------------------------
-- Dismisses a pending suggestion. The cooldown mechanism in
-- check_progression_eligibility will prevent re-suggestion for 3 sessions.

CREATE OR REPLACE FUNCTION public.dismiss_progression_suggestion(p_suggestion_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  suggestion RECORD;
BEGIN
  -- Get and lock the suggestion
  SELECT * INTO suggestion
  FROM public.progression_suggestions
  WHERE id = p_suggestion_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suggestion not found or already resolved';
  END IF;

  -- Mark suggestion as dismissed
  UPDATE public.progression_suggestions
  SET status = 'dismissed',
      resolved_at = now(),
      resolved_by = (SELECT auth.uid())
  WHERE id = p_suggestion_id;
END;
$$;

COMMENT ON FUNCTION public.dismiss_progression_suggestion(UUID)
  IS 'Dismisses a pending suggestion. Re-suggestion is blocked for 3 sessions via cooldown.';
