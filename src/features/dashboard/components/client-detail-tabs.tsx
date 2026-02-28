import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useActivePlan, useClientPlans } from "@/features/plans/hooks/usePlans";
import { useCreatePlanVersion } from "@/features/plans/hooks/usePlanMutations";
import { PlanCard } from "@/features/plans/components/plan-card";
import { PlanVersionBanner } from "@/features/plans/components/plan-version-banner";
import { WorkoutHistoryList } from "@/features/workouts/components/workout-history-list";
import { useWorkoutHistory } from "@/features/workouts/hooks/useWorkouts";
import { useExercises } from "@/features/exercises/hooks/useExercises";
import { StrengthChart } from "@/features/progress/components/StrengthChart";
import { MeasurementChart } from "@/features/progress/components/MeasurementChart";
import { MeasurementHistory } from "@/features/measurements/components/MeasurementHistory";

interface ClientDetailTabsProps {
  clientId: string;
  clientName: string;
}

/**
 * Tabbed view of a specific client's data for the trainer.
 * Tab 1: Plan (consolidated from ClientPlanPage) with version management
 * Tab 2: Logs (client's recent workout sessions)
 * Tab 3: Progress (strength and body measurement charts)
 * Tab 4: Measurements (measurement history with add button)
 */
export function ClientDetailTabs({
  clientId,
  clientName,
}: ClientDetailTabsProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="plan" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="plan" className="flex-1">
          {t("clientDetail.plan", "Plan")}
        </TabsTrigger>
        <TabsTrigger value="logs" className="flex-1">
          {t("clientDetail.logs", "Logs")}
        </TabsTrigger>
        <TabsTrigger value="progress" className="flex-1">
          {t("trainer.tabs.progress", "Progress")}
        </TabsTrigger>
        <TabsTrigger value="measurements" className="flex-1">
          {t("trainer.tabs.measurements", "Measurements")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="plan">
        <PlanTab
          clientId={clientId}
          clientName={clientName}
          navigate={navigate}
        />
      </TabsContent>

      <TabsContent value="logs">
        <LogsTab clientId={clientId} />
      </TabsContent>

      <TabsContent value="progress">
        <ProgressTab clientId={clientId} />
      </TabsContent>

      <TabsContent value="measurements">
        <MeasurementsTab clientId={clientId} navigate={navigate} />
      </TabsContent>
    </Tabs>
  );
}

/**
 * Plan tab: Active plan display, draft version banner, create/edit actions.
 * Consolidates all functionality from the deleted ClientPlanPage.tsx.
 */
function PlanTab({
  clientId,
  clientName,
  navigate,
}: {
  clientId: string;
  clientName: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { t } = useTranslation();
  const {
    data: activePlan,
    isPending: planLoading,
    error: planError,
  } = useActivePlan(clientId);

  const { data: allPlans } = useClientPlans(clientId);
  const createVersion = useCreatePlanVersion();

  // Find the draft version if it exists
  const draftPlan = useMemo(() => {
    return allPlans?.find((p) => p.status === "draft") ?? null;
  }, [allPlans]);

  const handleEditPlan = () => {
    if (!activePlan) return;

    createVersion.mutate(
      {
        sourcePlanId: activePlan.id,
        clientId,
      },
      {
        onSuccess: ({ newPlanId }) => {
          navigate(`/trainer/clients/${clientId}/plan/${newPlanId}/edit`);
        },
      }
    );
  };

  const handleEditDraft = () => {
    if (!draftPlan) return;
    navigate(`/trainer/clients/${clientId}/plan/${draftPlan.id}/edit`);
  };

  if (planLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (planError) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-destructive">{t("common.error")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Draft version banner */}
      {draftPlan && (
        <PlanVersionBanner
          draftPlan={draftPlan}
          clientName={clientName}
          onEditDraft={handleEditDraft}
          onActivated={() => {
            // Refresh happens via query invalidation in the mutation
          }}
        />
      )}

      {/* Active plan or empty state */}
      {activePlan ? (
        <PlanCard
          plan={activePlan}
          onEdit={handleEditPlan}
          onActivate={undefined}
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-center font-medium">
              {t("plans.noActivePlan", "No plan assigned")}
            </p>
            <p className="text-center text-sm text-muted-foreground">
              {t(
                "plans.createFirst",
                "Create a training plan for this client to get started."
              )}
            </p>
            <Button
              className="min-h-[44px]"
              onClick={() =>
                navigate(`/trainer/clients/${clientId}/plan/new`)
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("plans.createPlan", "Create Plan")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Plan button when active plan exists but no draft */}
      {activePlan && !draftPlan && (
        <Button
          variant="outline"
          className="w-full min-h-[44px]"
          onClick={() =>
            navigate(`/trainer/clients/${clientId}/plan/new`)
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("plans.createNewPlan", "Create New Plan")}
        </Button>
      )}
    </div>
  );
}

/**
 * Logs tab: Shows client's recent workout sessions.
 * Reuses WorkoutHistoryList component from the client history feature.
 */
function LogsTab({ clientId }: { clientId: string }) {
  const { data: sessions, isPending } = useWorkoutHistory(clientId);

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="pt-2">
      <WorkoutHistoryList sessions={sessions ?? []} />
    </div>
  );
}

/**
 * Progress tab: Strength and body measurement charts for the client.
 */
function ProgressTab({ clientId }: { clientId: string }) {
  const { data: exercises } = useExercises();

  const exerciseList = (exercises ?? []).map((e) => ({
    id: e.id,
    name: e.name,
  }));

  return (
    <div className="space-y-6 pt-2">
      {exerciseList.length > 0 && (
        <StrengthChart clientId={clientId} exercises={exerciseList} />
      )}
      <MeasurementChart clientId={clientId} />
    </div>
  );
}

/**
 * Measurements tab: Measurement history with navigation to new measurement form.
 */
function MeasurementsTab({
  clientId,
  navigate,
}: {
  clientId: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div className="pt-2">
      <MeasurementHistory
        clientId={clientId}
        onNewMeasurement={() =>
          navigate(`/trainer/clients/${clientId}/measurements/new`)
        }
      />
    </div>
  );
}
