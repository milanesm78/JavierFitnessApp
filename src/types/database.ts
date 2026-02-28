export type UserRole = "trainer" | "client";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  preferred_language: string;
  theme: string;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: number;
  user_id: string;
  role: UserRole;
}

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

export type PlanStatus = "draft" | "active" | "archived";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          is_active: boolean;
          preferred_language: string;
          theme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          is_active?: boolean;
          preferred_language?: string;
          theme?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          is_active?: boolean;
          preferred_language?: string;
          theme?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: number;
          user_id: string;
          role: UserRole;
        };
        Insert: {
          id?: number;
          user_id: string;
          role: UserRole;
        };
        Update: {
          id?: number;
          user_id?: string;
          role?: UserRole;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          youtube_url: string;
          description: string | null;
          default_weight_kg: number | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          youtube_url: string;
          description?: string | null;
          default_weight_kg?: number | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          youtube_url?: string;
          description?: string | null;
          default_weight_kg?: number | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      training_plans: {
        Row: {
          id: string;
          client_id: string;
          plan_group_id: string;
          version: number;
          name: string;
          cycle_length_weeks: number;
          status: PlanStatus;
          created_at: string;
          activated_at: string | null;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          plan_group_id: string;
          version?: number;
          name: string;
          cycle_length_weeks?: number;
          status?: PlanStatus;
          created_at?: string;
          activated_at?: string | null;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          plan_group_id?: string;
          version?: number;
          name?: string;
          cycle_length_weeks?: number;
          status?: PlanStatus;
          created_at?: string;
          activated_at?: string | null;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      training_days: {
        Row: {
          id: string;
          plan_id: string;
          day_label: string;
          day_order: number;
        };
        Insert: {
          id?: string;
          plan_id: string;
          day_label: string;
          day_order: number;
        };
        Update: {
          id?: string;
          plan_id?: string;
          day_label?: string;
          day_order?: number;
        };
        Relationships: [];
      };
      plan_exercises: {
        Row: {
          id: string;
          training_day_id: string;
          exercise_id: string;
          exercise_order: number;
          prescribed_sets: number;
          prescribed_reps: number;
          prescribed_weight_kg: number;
        };
        Insert: {
          id?: string;
          training_day_id: string;
          exercise_id: string;
          exercise_order: number;
          prescribed_sets: number;
          prescribed_reps: number;
          prescribed_weight_kg: number;
        };
        Update: {
          id?: string;
          training_day_id?: string;
          exercise_id?: string;
          exercise_order?: number;
          prescribed_sets?: number;
          prescribed_reps?: number;
          prescribed_weight_kg?: number;
        };
        Relationships: [];
      };
      workout_sessions: {
        Row: {
          id: string;
          client_id: string;
          training_day_id: string;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          training_day_id: string;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          training_day_id?: string;
          started_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      workout_sets: {
        Row: {
          id: string;
          session_id: string;
          plan_exercise_id: string;
          set_number: number;
          weight_kg: number;
          reps: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          plan_exercise_id: string;
          set_number: number;
          weight_kg: number;
          reps: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          plan_exercise_id?: string;
          set_number?: number;
          weight_kg?: number;
          reps?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      body_measurements: {
        Row: {
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
        };
        Insert: {
          id?: string;
          client_id: string;
          measured_at?: string;
          weight: number;
          height: number;
          skinfold_triceps?: number | null;
          skinfold_subscapular?: number | null;
          skinfold_suprailiac?: number | null;
          skinfold_abdominal?: number | null;
          skinfold_thigh?: number | null;
          skinfold_calf?: number | null;
          diameter_humeral?: number | null;
          diameter_femoral?: number | null;
          diameter_bistyloidal?: number | null;
          circ_arm_relaxed?: number | null;
          circ_arm_flexed?: number | null;
          circ_chest?: number | null;
          circ_waist?: number | null;
          circ_hip?: number | null;
          circ_thigh?: number | null;
          circ_calf?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          measured_at?: string;
          weight?: number;
          height?: number;
          skinfold_triceps?: number | null;
          skinfold_subscapular?: number | null;
          skinfold_suprailiac?: number | null;
          skinfold_abdominal?: number | null;
          skinfold_thigh?: number | null;
          skinfold_calf?: number | null;
          diameter_humeral?: number | null;
          diameter_femoral?: number | null;
          diameter_bistyloidal?: number | null;
          circ_arm_relaxed?: number | null;
          circ_arm_flexed?: number | null;
          circ_chest?: number | null;
          circ_waist?: number | null;
          circ_hip?: number | null;
          circ_thigh?: number | null;
          circ_calf?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_plan_version: {
        Args: {
          source_plan_id: string;
        };
        Returns: string;
      };
      activate_plan_version: {
        Args: {
          new_plan_id: string;
        };
        Returns: undefined;
      };
      get_client_dashboard: {
        Args: Record<string, never>;
        Returns: {
          client_id: string;
          full_name: string;
          email: string;
          status: string;
          has_active_plan: boolean;
          today_workout_status: string;
          last_workout_at: string | null;
        }[];
      };
      get_strength_progress: {
        Args: {
          p_client_id: string;
          p_exercise_id: string;
          p_from_date?: string;
          p_to_date?: string;
        };
        Returns: {
          date: string;
          max_weight: number;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
    };
  };
}
