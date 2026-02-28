import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlanForm } from "@/features/plans/components/plan-form";
import { usePlanDetail } from "@/features/plans/hooks/usePlans";
import {
  useCreatePlan,
  useUpdateDraftPlan,
} from "@/features/plans/hooks/usePlanMutations";
import type { PlanFormValues } from "@/features/plans/schemas";

export function PlanEditPage() {
  const { clientId, planId } = useParams<{
    clientId: string;
    planId: string;
  }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isEditMode = !!planId;
  const {
    data: existingPlan,
    isPending: isPlanLoading,
    error: planError,
  } = usePlanDetail(planId);

  const createPlan = useCreatePlan();
  const updatePlan = useUpdateDraftPlan();

  const isSubmitting = createPlan.isPending || updatePlan.isPending;

  const handleSubmit = (values: PlanFormValues) => {
    if (isEditMode && planId) {
      updatePlan.mutate(
        { planId, values },
        {
          onSuccess: () => {
            navigate(`/trainer/clients/${clientId}`);
          },
        }
      );
    } else {
      createPlan.mutate(values, {
        onSuccess: () => {
          navigate(`/trainer/clients/${clientId}`);
        },
      });
    }
  };

  if (isEditMode && isPlanLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (isEditMode && planError) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-destructive">{t("common.error")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => navigate(`/trainer/clients/${clientId}`)}
          aria-label={t("common.back", "Back")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">
          {isEditMode
            ? t("plans.editPlan", "Edit Plan")
            : t("plans.createPlan", "Create Plan")}
        </h1>
      </div>

      {/* Plan form */}
      {clientId && (
        <PlanForm
          clientId={clientId}
          existingPlan={isEditMode ? existingPlan : undefined}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
