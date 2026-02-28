import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useWorkoutHistory } from "@/features/workouts/hooks/useWorkouts";
import { WorkoutHistoryList } from "@/features/workouts/components/workout-history-list";

const PAGE_SIZE = 20;

/**
 * Page for client to view their workout history.
 * Route: /client/history
 */
export function WorkoutHistoryPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data: sessions, isPending } = useWorkoutHistory(user?.id, limit);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        {t("history.title", "Workout History")}
      </h1>

      {isPending && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border bg-muted"
            />
          ))}
        </div>
      )}

      {!isPending && sessions && (
        <>
          <WorkoutHistoryList sessions={sessions} />

          {sessions.length >= limit && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                className="min-h-[44px]"
                onClick={() => setLimit((prev) => prev + PAGE_SIZE)}
              >
                {t("history.loadMore", "Load more")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
