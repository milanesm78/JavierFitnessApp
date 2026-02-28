import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { BodyMeasurement } from "../types";
import type { MeasurementFormValues } from "../schemas";

export const measurementKeys = {
  all: ["measurements"] as const,
  lists: () => [...measurementKeys.all, "list"] as const,
  list: (clientId: string) =>
    [...measurementKeys.all, "list", clientId] as const,
  latest: (clientId: string) =>
    [...measurementKeys.all, "latest", clientId] as const,
};

/**
 * Fetch all measurements for a client ordered by measured_at DESC.
 */
export function useClientMeasurements(clientId: string | undefined) {
  return useQuery({
    queryKey: measurementKeys.list(clientId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("client_id", clientId!)
        .order("measured_at", { ascending: false });

      if (error) throw error;
      return data as BodyMeasurement[];
    },
    enabled: !!clientId,
  });
}

/**
 * Fetch the single most recent measurement for a client.
 * Used to show previous values as placeholder reference in form.
 */
export function useLatestMeasurement(clientId: string | undefined) {
  return useQuery({
    queryKey: measurementKeys.latest(clientId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("client_id", clientId!)
        .order("measured_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as BodyMeasurement | null;
    },
    enabled: !!clientId,
  });
}

/**
 * Mutation to create a new body measurement.
 * Converts form data to DB row format and invalidates cache on success.
 */
export function useCreateMeasurement() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({
      clientId,
      data,
    }: {
      clientId: string;
      data: MeasurementFormValues;
    }) => {
      const row = {
        client_id: clientId,
        measured_at: data.measured_at,
        weight: data.weight,
        height: data.height,
        skinfold_triceps: data.skinfold_triceps ?? null,
        skinfold_subscapular: data.skinfold_subscapular ?? null,
        skinfold_suprailiac: data.skinfold_suprailiac ?? null,
        skinfold_abdominal: data.skinfold_abdominal ?? null,
        skinfold_thigh: data.skinfold_thigh ?? null,
        skinfold_calf: data.skinfold_calf ?? null,
        diameter_humeral: data.diameter_humeral ?? null,
        diameter_femoral: data.diameter_femoral ?? null,
        diameter_bistyloidal: data.diameter_bistyloidal ?? null,
        circ_arm_relaxed: data.circ_arm_relaxed ?? null,
        circ_arm_flexed: data.circ_arm_flexed ?? null,
        circ_chest: data.circ_chest ?? null,
        circ_waist: data.circ_waist ?? null,
        circ_hip: data.circ_hip ?? null,
        circ_thigh: data.circ_thigh ?? null,
        circ_calf: data.circ_calf ?? null,
        notes: data.notes ?? null,
      };

      const { data: result, error } = await supabase
        .from("body_measurements")
        .insert(row)
        .select()
        .single();

      if (error) throw error;
      return result as BodyMeasurement;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: measurementKeys.list(variables.clientId),
      });
      queryClient.invalidateQueries({
        queryKey: measurementKeys.latest(variables.clientId),
      });
      toast.success(t("measurements.saved"));
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });
}
