import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { PlanWithDays, TrainingPlan } from "../types";

export const planKeys = {
  all: ["plans"] as const,
  lists: () => [...planKeys.all, "list"] as const,
  list: (clientId: string) => [...planKeys.all, "list", clientId] as const,
  details: () => [...planKeys.all, "detail"] as const,
  detail: (planId: string) => [...planKeys.all, "detail", planId] as const,
  active: (clientId: string) => [...planKeys.all, "active", clientId] as const,
};

/**
 * Fetch the active plan for a client with nested training days, exercises, and exercise details.
 * Sorts days by day_order and exercises by exercise_order.
 */
export function useActivePlan(clientId: string | undefined) {
  return useQuery({
    queryKey: planKeys.active(clientId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_plans")
        .select(
          `
          id,
          client_id,
          plan_group_id,
          version,
          name,
          cycle_length_weeks,
          status,
          created_at,
          activated_at,
          archived_at,
          training_days (
            id,
            plan_id,
            day_label,
            day_order,
            plan_exercises (
              id,
              training_day_id,
              exercise_id,
              exercise_order,
              prescribed_sets,
              prescribed_reps,
              prescribed_weight_kg,
              exercises (
                id,
                name,
                youtube_url
              )
            )
          )
        `
        )
        .eq("client_id", clientId!)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Sort days and exercises by order
      const plan = data as unknown as PlanWithDays;
      plan.training_days.sort((a, b) => a.day_order - b.day_order);
      plan.training_days.forEach((day) => {
        day.plan_exercises.sort(
          (a, b) => a.exercise_order - b.exercise_order
        );
      });

      return plan;
    },
    enabled: !!clientId,
  });
}

/**
 * Fetch all plan versions for a client, ordered by version descending.
 */
export function useClientPlans(clientId: string | undefined) {
  return useQuery({
    queryKey: planKeys.list(clientId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_plans")
        .select("*")
        .eq("client_id", clientId!)
        .order("version", { ascending: false });

      if (error) throw error;
      return data as TrainingPlan[];
    },
    enabled: !!clientId,
  });
}

/**
 * Fetch a single plan with full nested data (training days, exercises, exercise details).
 */
export function usePlanDetail(planId: string | undefined) {
  return useQuery({
    queryKey: planKeys.detail(planId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_plans")
        .select(
          `
          id,
          client_id,
          plan_group_id,
          version,
          name,
          cycle_length_weeks,
          status,
          created_at,
          activated_at,
          archived_at,
          training_days (
            id,
            plan_id,
            day_label,
            day_order,
            plan_exercises (
              id,
              training_day_id,
              exercise_id,
              exercise_order,
              prescribed_sets,
              prescribed_reps,
              prescribed_weight_kg,
              exercises (
                id,
                name,
                youtube_url
              )
            )
          )
        `
        )
        .eq("id", planId!)
        .single();

      if (error) throw error;

      // Sort days and exercises by order
      const plan = data as unknown as PlanWithDays;
      plan.training_days.sort((a, b) => a.day_order - b.day_order);
      plan.training_days.forEach((day) => {
        day.plan_exercises.sort(
          (a, b) => a.exercise_order - b.exercise_order
        );
      });

      return plan;
    },
    enabled: !!planId,
  });
}
