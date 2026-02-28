-- Body measurements table for anthropometric data
-- Flat column schema (NOT EAV pattern) per research anti-pattern warning.

CREATE TABLE body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id),
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- General
  weight DECIMAL(5,1) NOT NULL,
  height DECIMAL(4,1) NOT NULL,

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

  -- CHECK constraints
  CONSTRAINT chk_weight CHECK (weight >= 20 AND weight <= 300),
  CONSTRAINT chk_height CHECK (height >= 100 AND height <= 250)
);

-- Index for efficient client+date lookups
CREATE INDEX idx_measurements_client_date ON body_measurements(client_id, measured_at DESC);

-- Enable RLS
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- RLS policies (separate per operation, using is_trainer() helper)
CREATE POLICY "Clients read own measurements"
  ON body_measurements FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Trainer reads all measurements"
  ON body_measurements FOR SELECT
  USING (is_trainer());

CREATE POLICY "Trainer inserts measurements"
  ON body_measurements FOR INSERT
  WITH CHECK (is_trainer());

CREATE POLICY "Trainer updates measurements"
  ON body_measurements FOR UPDATE
  USING (is_trainer());

CREATE POLICY "Trainer deletes measurements"
  ON body_measurements FOR DELETE
  USING (is_trainer());

-- RPC function for strength progress charts (serves Plan 02)
CREATE OR REPLACE FUNCTION get_strength_progress(
  p_client_id UUID,
  p_exercise_id UUID,
  p_from_date DATE DEFAULT (now() - INTERVAL '12 months')::date,
  p_to_date DATE DEFAULT now()::date
)
RETURNS TABLE(date DATE, max_weight DECIMAL)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    ws.completed_at::date AS date,
    MAX(wset.weight_kg) AS max_weight
  FROM workout_sets wset
  JOIN workout_sessions ws ON ws.id = wset.session_id
  JOIN plan_exercises pe ON pe.id = wset.plan_exercise_id
  WHERE ws.client_id = p_client_id
    AND pe.exercise_id = p_exercise_id
    AND ws.completed_at IS NOT NULL
    AND ws.completed_at::date >= p_from_date
    AND ws.completed_at::date <= p_to_date
  GROUP BY ws.completed_at::date
  ORDER BY ws.completed_at::date;
$$;
