import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActivatePlan } from "../hooks/usePlanMutations";
import type { TrainingPlan } from "../types";

interface PlanVersionBannerProps {
  draftPlan: TrainingPlan;
  clientName: string;
  onEditDraft: () => void;
  onActivated?: () => void;
}

export function PlanVersionBanner({
  draftPlan,
  clientName,
  onEditDraft,
  onActivated,
}: PlanVersionBannerProps) {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const activatePlan = useActivatePlan();

  const handleActivate = () => {
    activatePlan.mutate(
      {
        planId: draftPlan.id,
        clientId: draftPlan.client_id,
      },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          onActivated?.();
        },
      }
    );
  };

  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-700 dark:bg-yellow-950/30">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {t("plans.draftAvailable", "Draft version {{version}} available", {
              version: draftPlan.version,
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="min-h-[36px]"
            onClick={onEditDraft}
          >
            {t("plans.editDraft", "Edit Draft")}
          </Button>
          <Button
            size="sm"
            className="min-h-[36px]"
            onClick={() => setConfirmOpen(true)}
          >
            {t("plans.activatePlan", "Activate")}
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("plans.activatePlan", "Activate Plan")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "plans.activateConfirm",
                "Activate this plan for {{name}}? Their current plan will be archived.",
                { name: clientName }
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={activatePlan.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleActivate}
              disabled={activatePlan.isPending}
            >
              {activatePlan.isPending
                ? t("common.loading")
                : t("plans.activatePlan", "Activate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
