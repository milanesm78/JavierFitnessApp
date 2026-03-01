export type ProgressionStatus = "pending" | "accepted" | "dismissed";

export interface ProgressionSuggestion {
  id: string;
  client_id: string;
  exercise_id: string;
  plan_exercise_id: string;
  current_weight_kg: number;
  suggested_weight_kg: number;
  triggered_by_session_id: string;
  status: ProgressionStatus;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  /** Joined exercise data (available when using select with join) */
  exercise?: { name: string };
  /** Joined plan exercise data (for stale detection in UI) */
  plan_exercise?: { prescribed_weight_kg: number };
}

/** Suggestion with exercise name guaranteed (from joined query) */
export type ProgressionSuggestionWithExercise = ProgressionSuggestion & {
  exercise: { name: string };
};
