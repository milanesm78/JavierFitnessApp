-- Add description and default_weight_kg columns to exercises table
-- These fields close UAT gap: exercise form was missing description and default weight inputs

ALTER TABLE public.exercises ADD COLUMN description text;
ALTER TABLE public.exercises ADD COLUMN default_weight_kg numeric;
