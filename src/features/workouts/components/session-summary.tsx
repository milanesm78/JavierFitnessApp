import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Timer, Dumbbell, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionSummaryProps {
  duration: number; // seconds
  totalSetsLogged: number;
  totalExercises: number;
}

/**
 * Post-workout summary shown after completing a session.
 * Shows session duration, total sets logged, and total exercises completed.
 * Clean, celebratory-but-simple design with green accent.
 */
export function SessionSummary({
  duration,
  totalSetsLogged,
  totalExercises,
}: SessionSummaryProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const formattedDuration = useMemo(() => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [duration]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      {/* Success icon */}
      <div className="mb-6">
        <CheckCircle2 className="h-20 w-20 text-green-500" />
      </div>

      <h1 className="text-2xl font-bold mb-2">
        {t("workout.completed", "Workout Complete!")}
      </h1>
      <p className="text-muted-foreground mb-8">
        {t("workout.greatJob", "Great job! Here's your summary.")}
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-10">
        <div className="flex flex-col items-center gap-1 rounded-lg border bg-card p-4">
          <Timer className="h-5 w-5 text-muted-foreground" />
          <span className="text-lg font-bold">{formattedDuration}</span>
          <span className="text-xs text-muted-foreground">
            {t("workout.duration", "Duration")}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg border bg-card p-4">
          <Dumbbell className="h-5 w-5 text-muted-foreground" />
          <span className="text-lg font-bold">{totalSetsLogged}</span>
          <span className="text-xs text-muted-foreground">
            {t("workout.sets", "Sets")}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg border bg-card p-4">
          <Target className="h-5 w-5 text-muted-foreground" />
          <span className="text-lg font-bold">{totalExercises}</span>
          <span className="text-xs text-muted-foreground">
            {t("workout.exercisesCompleted", "Exercises")}
          </span>
        </div>
      </div>

      {/* Done button */}
      <Button
        className="w-full max-w-sm h-14 text-base font-semibold"
        onClick={() => navigate("/client/plan")}
      >
        {t("workout.done", "Done")}
      </Button>
    </div>
  );
}
