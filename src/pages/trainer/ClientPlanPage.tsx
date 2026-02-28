import { useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useClientDetail } from "@/features/dashboard/hooks/useDashboard";
import { useClientPlans } from "@/features/plans/hooks/usePlans";
import { useCreatePlanVersion } from "@/features/plans/hooks/usePlanMutations";
import { PlanCard } from "@/features/plans/components/plan-card";
import { PlanVersionBanner } from "@/features/plans/components/plan-version-banner";

export function ClientPlanPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: clientData, isPending, error } = useClientDetail(clientId);
  const { data: allPlans } = useClientPlans(clientId);
  const createVersion = useCreatePlanVersion();

  // Find the draft version if it exists
  const draftPlan = useMemo(() => {
    return allPlans?.find((p) => p.status === "draft") ?? null;
  }, [allPlans]);

  const handleEditPlan = () => {
    if (!clientData?.activePlan || !clientId) return;

    // Create a new version from the active plan, then navigate to edit it
    createVersion.mutate(
      {
        sourcePlanId: clientData.activePlan.id,
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
    if (!draftPlan || !clientId) return;
    navigate(`/trainer/clients/${clientId}/plan/${draftPlan.id}/edit`);
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-destructive">{t("common.error")}</p>
        </CardContent>
      </Card>
    );
  }

  const profile = clientData?.profile;
  const activePlan = clientData?.activePlan;
  const clientName = profile?.full_name ?? profile?.email ?? "";

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => navigate("/trainer/clients")}
          aria-label={t("common.back", "Back")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{clientName}</h1>
          <p className="text-sm text-muted-foreground">
            {t("trainer.clientPlan", "Training Plan")}
          </p>
        </div>
      </div>

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
