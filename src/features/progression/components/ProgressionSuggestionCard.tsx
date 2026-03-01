import { useTranslation } from "react-i18next";
import { TrendingUp, ArrowRight, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAcceptSuggestion, useDismissSuggestion } from "../hooks/useProgression";
import type { ProgressionSuggestion } from "../types";

interface ProgressionSuggestionCardProps {
  suggestion: ProgressionSuggestion;
}

/**
 * Individual progression suggestion card.
 * Shows exercise name, current vs suggested weight, and accept/dismiss actions.
 * Accept uses a confirmation dialog since weight changes are significant.
 * Detects stale suggestions where prescribed weight has already changed.
 */
export function ProgressionSuggestionCard({
  suggestion,
}: ProgressionSuggestionCardProps) {
  const { t } = useTranslation();
  const acceptMutation = useAcceptSuggestion();
  const dismissMutation = useDismissSuggestion();

  const exerciseName = suggestion.exercise?.name ?? "Unknown Exercise";
  const isStale =
    suggestion.plan_exercise != null &&
    suggestion.plan_exercise.prescribed_weight_kg !== suggestion.current_weight_kg;

  const handleAccept = () => {
    acceptMutation.mutate(suggestion.id);
  };

  const handleDismiss = () => {
    dismissMutation.mutate(suggestion.id);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2 p-4">
        <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
        <span className="font-semibold text-sm truncate">{exerciseName}</span>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        {/* Weight comparison */}
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {t("progression.current_weight", "Current")}
            </p>
            <p className="text-lg font-bold">{suggestion.current_weight_kg}kg</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {t("progression.suggested_weight", "Suggested")}
            </p>
            <p className="text-lg font-bold text-green-500">
              {suggestion.suggested_weight_kg}kg
            </p>
          </div>
        </div>

        {/* Stale warning */}
        {isStale && (
          <div className="flex items-start gap-2 rounded-md bg-muted p-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {t(
                "progression.stale_warning",
                "This suggestion is outdated -- the prescribed weight has already changed."
              )}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-h-[44px]"
            onClick={handleDismiss}
            disabled={dismissMutation.isPending || acceptMutation.isPending}
          >
            {t("progression.dismiss", "Not Now")}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                className="flex-1 min-h-[44px]"
                disabled={
                  isStale || acceptMutation.isPending || dismissMutation.isPending
                }
              >
                {t("progression.accept", "Increase Weight")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("progression.suggestion_title", "Weight Increase Suggestion")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("progression.suggestion_body", {
                    reps: 15,
                    exercise: exerciseName,
                    currentWeight: suggestion.current_weight_kg,
                    suggestedWeight: suggestion.suggested_weight_kg,
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("progression.dismiss", "Not Now")}
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleAccept}>
                  {t("progression.accept", "Increase Weight")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
