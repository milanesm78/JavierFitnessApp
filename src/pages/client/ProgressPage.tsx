import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useExercises } from "@/features/exercises/hooks/useExercises";
import { StrengthChart } from "@/features/progress/components/StrengthChart";
import { MeasurementChart } from "@/features/progress/components/MeasurementChart";
import { MeasurementHistory } from "@/features/measurements/components/MeasurementHistory";

/**
 * Client progress page at /client/progress.
 * Two tabs: Strength (line chart per exercise) and Body (measurement chart + history).
 */
export function ProgressPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { data: exercises } = useExercises();

  const clientId = session?.user?.id;

  if (!clientId) {
    return null;
  }

  const exerciseList = (exercises ?? []).map((e) => ({
    id: e.id,
    name: e.name,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t("progress.title")}</h1>

      <Tabs defaultValue="strength" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="strength" className="flex-1">
            {t("progress.strength")}
          </TabsTrigger>
          <TabsTrigger value="body" className="flex-1">
            {t("progress.body")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="strength">
          <div className="pt-2">
            {exerciseList.length > 0 ? (
              <StrengthChart
                clientId={clientId}
                exercises={exerciseList}
              />
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="body">
          <div className="space-y-6 pt-2">
            <MeasurementChart clientId={clientId} />
            <MeasurementHistory clientId={clientId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
