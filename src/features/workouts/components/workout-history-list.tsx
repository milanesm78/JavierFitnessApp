import { useTranslation } from "react-i18next";
import { Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SessionDetailCard } from "./session-detail-card";
import type { SessionWithSets } from "../types";

interface WorkoutHistoryListProps {
  sessions: SessionWithSets[];
}

/**
 * Scrollable list of past workout sessions.
 * Shows most recent sessions first. Renders SessionDetailCard for each.
 */
export function WorkoutHistoryList({ sessions }: WorkoutHistoryListProps) {
  const { t } = useTranslation();

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <Dumbbell className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium">
              {t("history.noWorkouts", "No workouts logged yet")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t(
                "history.noWorkoutsDescription",
                "Start your first workout from your training plan."
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <SessionDetailCard key={session.id} session={session} />
      ))}
    </div>
  );
}
