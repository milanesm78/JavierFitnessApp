export interface BodyMeasurement {
  id: string;
  client_id: string;
  measured_at: string;
  weight: number;
  height: number;
  skinfold_triceps: number | null;
  skinfold_subscapular: number | null;
  skinfold_suprailiac: number | null;
  skinfold_abdominal: number | null;
  skinfold_thigh: number | null;
  skinfold_calf: number | null;
  diameter_humeral: number | null;
  diameter_femoral: number | null;
  diameter_bistyloidal: number | null;
  circ_arm_relaxed: number | null;
  circ_arm_flexed: number | null;
  circ_chest: number | null;
  circ_waist: number | null;
  circ_hip: number | null;
  circ_thigh: number | null;
  circ_calf: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type MeasurementCategory =
  | "general"
  | "skinFolds"
  | "boneDiameters"
  | "circumferences";

export interface MeasurementFieldMeta {
  name: string;
  unit: "kg" | "cm" | "mm";
  min: number;
  max: number;
  required: boolean;
}

export const MEASUREMENT_FIELDS: Record<MeasurementCategory, MeasurementFieldMeta[]> = {
  general: [
    { name: "weight", unit: "kg", min: 20, max: 300, required: true },
    { name: "height", unit: "cm", min: 100, max: 250, required: true },
  ],
  skinFolds: [
    { name: "skinfold_triceps", unit: "mm", min: 2, max: 60, required: false },
    { name: "skinfold_subscapular", unit: "mm", min: 2, max: 60, required: false },
    { name: "skinfold_suprailiac", unit: "mm", min: 2, max: 60, required: false },
    { name: "skinfold_abdominal", unit: "mm", min: 2, max: 60, required: false },
    { name: "skinfold_thigh", unit: "mm", min: 2, max: 60, required: false },
    { name: "skinfold_calf", unit: "mm", min: 2, max: 60, required: false },
  ],
  boneDiameters: [
    { name: "diameter_humeral", unit: "cm", min: 4, max: 10, required: false },
    { name: "diameter_femoral", unit: "cm", min: 6, max: 14, required: false },
    { name: "diameter_bistyloidal", unit: "cm", min: 3, max: 8, required: false },
  ],
  circumferences: [
    { name: "circ_arm_relaxed", unit: "cm", min: 15, max: 60, required: false },
    { name: "circ_arm_flexed", unit: "cm", min: 15, max: 65, required: false },
    { name: "circ_chest", unit: "cm", min: 60, max: 150, required: false },
    { name: "circ_waist", unit: "cm", min: 40, max: 150, required: false },
    { name: "circ_hip", unit: "cm", min: 50, max: 160, required: false },
    { name: "circ_thigh", unit: "cm", min: 30, max: 90, required: false },
    { name: "circ_calf", unit: "cm", min: 20, max: 60, required: false },
  ],
};
