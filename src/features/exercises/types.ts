export interface Exercise {
  id: string;
  name: string;
  youtube_url: string;
  description: string | null;
  default_weight_kg: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExerciseFormData {
  name: string;
  youtube_url: string;
  description: string;
  default_weight_kg: string;
}
