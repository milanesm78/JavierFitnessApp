import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const progressKeys = {
  all: ["progress"] as const,
  strength: (clientId: string, exerciseId: string) =>
    [...progressKeys.all, "strength", clientId, exerciseId] as const,
  measurements: (clientId: string) =>
    [...progressKeys.all, "measurements", clientId] as const,
};

interface StrengthDataPoint {
  date: string;
  max_weight: number;
}

/**
 * Fetches strength progress data for a specific exercise via
 * the get_strength_progress RPC. Returns max weight per date
 * for chart rendering. Default range: last 12 months (handled by RPC defaults).
 */
export function useStrengthProgress(
  clientId: string | undefined,
  exerciseId: string | undefined,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: progressKeys.strength(clientId ?? "", exerciseId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_strength_progress", {
        p_client_id: clientId!,
        p_exercise_id: exerciseId!,
      });

      if (error) throw error;
      return (data ?? []) as StrengthDataPoint[];
    },
    enabled: enabled && !!clientId && !!exerciseId,
  });
}
