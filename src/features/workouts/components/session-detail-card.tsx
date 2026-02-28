import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatSessionDuration } from "@/lib/utils/cycle";
import type { SessionWithSets } from "../types";

interface SessionDetailCardProps {
  session: SessionWithSets;
}

/**
 * Card showing a single past workout session.
 * Expandable to show all exercises with their logged sets.
 */
export function SessionDetailCard({ session }: SessionDetailCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const sessionDate = format(new Date(session.started_at), "PPP");
  const duration =
    session.completed_at
      ? formatSessionDuration(session.started_at, session.completed_at)
      : null;

  // Group sets by exercise (plan_exercise_id)
  const exerciseGroups = new Map<
    string,
    {
      exerciseName: string;
      sets: { set_number: number; weight_kg: number; reps: number }[];
    }
  >();

  for (const set of session.workout_sets) {
    const exerciseId = set.plan_exercise_id;
    const exerciseName =
      set.plan_exercises?.exercises?.name ?? t("plans.exercise", "Exercise");

    if (!exerciseGroups.has(exerciseId)) {
      exerciseGroups.set(exerciseId, { exerciseName, sets: [] });
    }
    exerciseGroups.get(exerciseId)!.sets.push({
      set_number: set.set_number,
      weight_kg: set.weight_kg,
      reps: set.reps,
    });
  }

  // Sort sets within each exercise by set_number
  for (const [, group] of exerciseGroups) {
    group.sets.sort((a, b) => a.set_number - b.set_number);
  }

  const totalSets = session.workout_sets.length;

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{sessionDate}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {duration}
              </span>
            )}
            <span>
              {totalSets} {t("workout.setsLogged", "sets logged")}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 ml-2">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-3">
          {Array.from(exerciseGroups.entries()).map(
            ([exerciseId, { exerciseName, sets }]) => (
              <div key={exerciseId} className="rounded-lg border p-3">
                <p className="text-sm font-medium mb-2">{exerciseName}</p>
                <div className="space-y-1">
                  {sets.map((set) => (
                    <div
                      key={set.set_number}
                      className="flex items-center justify-between text-xs text-muted-foreground"
                    >
                      <span>
                        {t("workout.set", "Set")} {set.set_number}
                      </span>
                      <span>
                        {set.weight_kg} {t("workout.kg", "kg")} x {set.reps}{" "}
                        {t("workout.reps", "reps")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </CardContent>
      )}
    </Card>
  );
}
