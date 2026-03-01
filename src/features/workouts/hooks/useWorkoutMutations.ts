import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { workoutKeys } from "./useWorkouts";
import { dashboardKeys } from "@/features/dashboard/hooks/useDashboard";
import { progressionKeys } from "@/features/progression/hooks/useProgression";
import type { WorkoutSet } from "../types";

/**
 * Start a new workout session for a training day.
 */
export function useStartSession() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({
      clientId,
      trainingDayId,
    }: {
      clientId: string;
      trainingDayId: string;
    }) => {
      const { data, error } = await supabase
        .from("workout_sessions")
        .insert({
          client_id: clientId,
          training_day_id: trainingDayId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: workoutKeys.sessions(data.client_id),
      });
    },
    onError: () => {
      toast.error(
        t("workouts.start_error", "Failed to start workout session")
      );
    },
  });
}

/**
 * Log a set with optimistic update.
 * Immediately shows the set as logged, rolls back on error.
 */
export function useLogSet(sessionId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (newSet: {
      plan_exercise_id: string;
      set_number: number;
      weight_kg: number;
      reps: number;
    }) => {
      const { data, error } = await supabase
        .from("workout_sets")
        .insert({ session_id: sessionId, ...newSet })
        .select()
        .single();

      if (error) throw error;
      return data as WorkoutSet;
    },

    // Optimistic update: show the set as logged immediately
    onMutate: async (newSet) => {
      await queryClient.cancelQueries({
        queryKey: workoutKeys.sets(sessionId),
      });

      const previousSets = queryClient.getQueryData<WorkoutSet[]>(
        workoutKeys.sets(sessionId)
      );

      queryClient.setQueryData<WorkoutSet[]>(
        workoutKeys.sets(sessionId),
        (old) => [
          ...(old || []),
          {
            ...newSet,
            id: "temp-" + Date.now(),
            session_id: sessionId,
            created_at: new Date().toISOString(),
          },
        ]
      );

      return { previousSets };
    },

    // Rollback on error
    onError: (_err, _newSet, context) => {
      queryClient.setQueryData(
        workoutKeys.sets(sessionId),
        context?.previousSets
      );
      toast.error(t("workouts.log_error", "Failed to log set"));
    },

    // Refetch to ensure server state is canonical
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: workoutKeys.sets(sessionId),
      });
    },
  });
}

/**
 * Complete a workout session by setting completed_at.
 */
export function useCompleteSession() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({
      sessionId,
      clientId,
    }: {
      sessionId: string;
      clientId: string;
    }) => {
      const { data, error } = await supabase
        .from("workout_sessions")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", sessionId)
        .select()
        .single();

      if (error) throw error;
      return { ...data, clientId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: workoutKeys.sessions(data.clientId),
      });
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.clients(),
      });
      toast.success(
        t("workouts.completed", "Workout completed!")
      );

      // Fire-and-forget: check for progression eligibility after session completion.
      // Detection failure should not break session completion UX.
      try {
        supabase
          .rpc("check_progression_eligibility", { p_session_id: data.id })
          .then(() => {
            queryClient.invalidateQueries({
              queryKey: progressionKeys.pending(data.clientId),
            });
          })
          .catch(() => {
            // Silently ignore progression detection errors
          });
      } catch {
        // Silently ignore progression detection errors
      }
    },
    onError: () => {
      toast.error(
        t("workouts.complete_error", "Failed to complete workout")
      );
    },
  });
}
