import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { planKeys } from "@/features/plans/hooks/usePlans";
import type { ProgressionSuggestion } from "../types";

export const progressionKeys = {
  all: ["progression"] as const,
  suggestions: (clientId: string) =>
    [...progressionKeys.all, "suggestions", clientId] as const,
  pending: (clientId: string) =>
    [...progressionKeys.all, "pending", clientId] as const,
};

/**
 * Mutation to check progression eligibility for a completed session.
 * Creates pending suggestions for exercises where client logged 15+ reps
 * at prescribed weight.
 */
export function useCheckProgression() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase.rpc(
        "check_progression_eligibility",
        { p_session_id: sessionId }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: progressionKeys.all,
      });
    },
  });
}

/**
 * Fetch pending progression suggestions for a client.
 * Includes joined exercise name and plan_exercise prescribed weight.
 */
export function usePendingSuggestions(clientId: string | undefined) {
  return useQuery({
    queryKey: progressionKeys.pending(clientId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progression_suggestions")
        .select(
          "*, exercise:exercises(name), plan_exercise:plan_exercises(prescribed_weight_kg)"
        )
        .eq("client_id", clientId!)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as ProgressionSuggestion[];
    },
    enabled: !!clientId,
  });
}

/**
 * Accept a progression suggestion: updates plan weight atomically.
 * Invalidates both progression and plan caches since weight changes.
 */
export function useAcceptSuggestion() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase.rpc(
        "accept_progression_suggestion",
        { p_suggestion_id: suggestionId }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: progressionKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: planKeys.all,
      });
      toast.success(
        t("progression.accepted_toast", "Weight updated successfully")
      );
    },
    onError: () => {
      toast.error(
        t(
          "progression.accept_error",
          "Failed to accept suggestion. It may be outdated."
        )
      );
    },
  });
}

/**
 * Dismiss a progression suggestion.
 * The 3-session cooldown prevents immediate re-suggestion.
 */
export function useDismissSuggestion() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase.rpc(
        "dismiss_progression_suggestion",
        { p_suggestion_id: suggestionId }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: progressionKeys.all,
      });
      toast.success(
        t("progression.dismissed_toast", "Suggestion dismissed")
      );
    },
    onError: () => {
      toast.error(
        t("progression.dismiss_error", "Failed to dismiss suggestion")
      );
    },
  });
}
