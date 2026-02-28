import { z } from "zod";

/**
 * Helper for optional/nullable measurement fields.
 * Converts undefined/NaN to null for DB storage.
 */
function optionalMeasurement(min: number, max: number) {
  return z
    .number()
    .min(min)
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v === undefined || (typeof v === "number" && isNaN(v)) ? null : v));
}

/**
 * Helper for required measurement fields.
 */
function requiredMeasurement(min: number, max: number) {
  return z.number().min(min).max(max);
}

export const measurementSchema = z.object({
  // General (required)
  weight: requiredMeasurement(20, 300),
  height: requiredMeasurement(100, 250),

  // Skin folds (optional, mm)
  skinfold_triceps: optionalMeasurement(2, 60),
  skinfold_subscapular: optionalMeasurement(2, 60),
  skinfold_suprailiac: optionalMeasurement(2, 60),
  skinfold_abdominal: optionalMeasurement(2, 60),
  skinfold_thigh: optionalMeasurement(2, 60),
  skinfold_calf: optionalMeasurement(2, 60),

  // Bone diameters (optional, cm)
  diameter_humeral: optionalMeasurement(4, 10),
  diameter_femoral: optionalMeasurement(6, 14),
  diameter_bistyloidal: optionalMeasurement(3, 8),

  // Circumferences (optional, cm)
  circ_arm_relaxed: optionalMeasurement(15, 60),
  circ_arm_flexed: optionalMeasurement(15, 65),
  circ_chest: optionalMeasurement(60, 150),
  circ_waist: optionalMeasurement(40, 150),
  circ_hip: optionalMeasurement(50, 160),
  circ_thigh: optionalMeasurement(30, 90),
  circ_calf: optionalMeasurement(20, 60),

  // Metadata
  notes: z.string().optional(),
  measured_at: z.string(),
});

export type MeasurementFormValues = z.infer<typeof measurementSchema>;
