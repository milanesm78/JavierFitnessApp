import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PlanWithDays } from "../types";
import type { PlanStatus } from "@/types/database";

interface PlanCardProps {
  plan: PlanWithDays;
  onEdit?: () => void;
  onActivate?: () => void;
}

function StatusBadge({ status }: { status: PlanStatus }) {
  const { t } = useTranslation();

  const styles: Record<PlanStatus, string> = {
    draft:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    active:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    archived:
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };

  const labels: Record<PlanStatus, string> = {
    draft: t("status.draft", "Draft"),
    active: t("status.active", "Active"),
    archived: t("status.archived", "Archived"),
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function PlanCard({ plan, onEdit, onActivate }: PlanCardProps) {
  const { t } = useTranslation();
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const toggleDay = (dayId: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) {
        next.delete(dayId);
      } else {
        next.add(dayId);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={plan.status} />
            <span className="text-xs text-muted-foreground">
              {t("plans.version", "Version")} {plan.version}
            </span>
            <span className="text-xs text-muted-foreground">
              {plan.cycle_length_weeks} {t("plans.weeks", "weeks")}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Training days list */}
        {plan.training_days.map((day) => {
          const isExpanded = expandedDays.has(day.id);
          return (
            <div key={day.id} className="rounded-lg border">
              <button
                type="button"
                onClick={() => toggleDay(day.id)}
                className="flex w-full items-center justify-between p-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{day.day_label}</span>
                  <span className="text-xs text-muted-foreground">
                    ({day.plan_exercises.length}{" "}
                    {day.plan_exercises.length === 1
                      ? t("plans.exercise", "exercise")
                      : t("plans.exercises_count", "exercises")})
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t px-3 pb-3 pt-2 space-y-1.5">
                  {day.plan_exercises.map((pe) => (
                    <div
                      key={pe.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{pe.exercises?.name ?? t("plans.exercise", "Exercise")}</span>
                      <span className="text-muted-foreground">
                        {pe.prescribed_sets} x {pe.prescribed_reps}
                        {pe.prescribed_weight_kg > 0 &&
                          ` @ ${pe.prescribed_weight_kg} ${t("plans.kg", "kg")}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onEdit && plan.status !== "archived" && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[40px]"
              onClick={onEdit}
            >
              {t("plans.editPlan", "Edit Plan")}
            </Button>
          )}
          {onActivate && plan.status === "draft" && (
            <Button size="sm" className="min-h-[40px]" onClick={onActivate}>
              {t("plans.activatePlan", "Activate Plan")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
