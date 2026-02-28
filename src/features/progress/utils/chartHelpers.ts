import { format, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { BodyMeasurement } from "@/features/measurements/types";

/**
 * Theme-friendly chart colors using HSL values with good contrast
 * on both light and dark backgrounds.
 */
export const CHART_COLORS = [
  "hsl(220, 70%, 50%)", // blue
  "hsl(142, 70%, 45%)", // green
  "hsl(35, 92%, 50%)", // amber
  "hsl(0, 72%, 51%)", // red
  "hsl(271, 60%, 55%)", // purple
  "hsl(187, 70%, 45%)", // teal
] as const;

/**
 * Transforms measurement rows into chart-compatible { date, value }[] format.
 * Filters out entries where the field value is null.
 */
export function toChartData(
  rows: BodyMeasurement[],
  field: string
): { date: string; value: number }[] {
  return rows
    .filter((row) => (row as unknown as Record<string, unknown>)[field] != null)
    .map((row) => ({
      date: row.measured_at,
      value: (row as unknown as Record<string, unknown>)[field] as number,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Formats ISO date string to short month+year label for chart axes.
 */
export function formatChartDate(dateStr: string, locale: string): string {
  const dateLocale = locale === "es" ? es : enUS;
  try {
    return format(parseISO(dateStr), "MMM yy", { locale: dateLocale });
  } catch {
    return dateStr;
  }
}

/**
 * Formats ISO date string to a full readable date for tooltips.
 */
export function formatTooltipDate(dateStr: string, locale: string): string {
  const dateLocale = locale === "es" ? es : enUS;
  try {
    return format(parseISO(dateStr), "PPP", { locale: dateLocale });
  } catch {
    return dateStr;
  }
}

export interface MeasurementChartField {
  key: string;
  labelKey: string;
  unit: string;
  category: "general" | "skinFolds" | "boneDiameters" | "circumferences";
}

/**
 * All chartable measurement fields with i18n label keys and units.
 * Drives the field selector UI in MeasurementChart.
 */
export const MEASUREMENT_CHART_FIELDS: MeasurementChartField[] = [
  // General
  { key: "weight", labelKey: "measurements.weight", unit: "kg", category: "general" },
  { key: "height", labelKey: "measurements.height", unit: "cm", category: "general" },
  // Skin Folds
  { key: "skinfold_triceps", labelKey: "measurements.skinfold_triceps", unit: "mm", category: "skinFolds" },
  { key: "skinfold_subscapular", labelKey: "measurements.skinfold_subscapular", unit: "mm", category: "skinFolds" },
  { key: "skinfold_suprailiac", labelKey: "measurements.skinfold_suprailiac", unit: "mm", category: "skinFolds" },
  { key: "skinfold_abdominal", labelKey: "measurements.skinfold_abdominal", unit: "mm", category: "skinFolds" },
  { key: "skinfold_thigh", labelKey: "measurements.skinfold_thigh", unit: "mm", category: "skinFolds" },
  { key: "skinfold_calf", labelKey: "measurements.skinfold_calf", unit: "mm", category: "skinFolds" },
  // Bone Diameters
  { key: "diameter_humeral", labelKey: "measurements.diameter_humeral", unit: "cm", category: "boneDiameters" },
  { key: "diameter_femoral", labelKey: "measurements.diameter_femoral", unit: "cm", category: "boneDiameters" },
  { key: "diameter_bistyloidal", labelKey: "measurements.diameter_bistyloidal", unit: "cm", category: "boneDiameters" },
  // Circumferences
  { key: "circ_arm_relaxed", labelKey: "measurements.circ_arm_relaxed", unit: "cm", category: "circumferences" },
  { key: "circ_arm_flexed", labelKey: "measurements.circ_arm_flexed", unit: "cm", category: "circumferences" },
  { key: "circ_chest", labelKey: "measurements.circ_chest", unit: "cm", category: "circumferences" },
  { key: "circ_waist", labelKey: "measurements.circ_waist", unit: "cm", category: "circumferences" },
  { key: "circ_hip", labelKey: "measurements.circ_hip", unit: "cm", category: "circumferences" },
  { key: "circ_thigh", labelKey: "measurements.circ_thigh", unit: "cm", category: "circumferences" },
  { key: "circ_calf", labelKey: "measurements.circ_calf", unit: "cm", category: "circumferences" },
];
