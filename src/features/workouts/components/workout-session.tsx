import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useStartSession } from "../hooks/useWorkoutMutations";
import { useCompleteSession } from "../hooks/useWorkoutMutations";
import { useLogSet } from "../hooks/useWorkoutMutations";
import { useLastSessionValues, useSessionSets } from "../hooks/useWorkouts";
import { ExerciseLogger } from "./exercise-logger";
import { SessionSummary } from "./session-summary";
import type { TrainingDayWithExercises } from "@/features/plans/types";
import type { WorkoutSession as WorkoutSessionType } from "../types";

interface WorkoutSessionProps {
  trainingDayId: string;
  trainingDay: TrainingDayWithExercises;
}

/**
 * Container component managing the active workout session.
 * On mount: starts a new session, fetches pre-fill data from last session.
 * Renders ExerciseLogger for each exercise.
 * Tracks session duration with a timer.
 * After completion: shows SessionSummary.
 */
export function WorkoutSession({
  trainingDayId,
  trainingDay,
}: WorkoutSessionProps) {
  const { t } = useTranslation();
  const { session: authSession } = useAuth();
  const clientId = authSession?.user?.id;

  const [activeSession, setActiveSession] =
    useState<WorkoutSessionType | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Mutations
  const startSession = useStartSession();
  const completeSession = useCompleteSession();

  // Queries
  const { data: lastSessionValues } = useLastSessionValues(
    clientId,
    trainingDayId
  );
  const { data: loggedSets = [] } = useSessionSets(activeSession?.id);

  // UseLogSet needs the session ID
  const logSetMutation = useLogSet(activeSession?.id ?? "");

  // Start a new session on mount
  useEffect(() => {
    if (!clientId || activeSession || startSession.isPending) return;

    startSession.mutate(
      { clientId, trainingDayId },
      {
        onSuccess: (data) => {
          setActiveSession(data as WorkoutSessionType);
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, trainingDayId]);

  // Session timer: update every second
  useEffect(() => {
    if (!activeSession || isCompleted) return;

    const startTime = new Date(activeSession.started_at).getTime();
    const interval = setInterval(() => {
      setElapsedSeconds(
        Math.floor((Date.now() - startTime) / 1000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, isCompleted]);

  // Format elapsed time as MM:SS or H:MM:SS
  const formattedTime = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
  }, [elapsedSeconds]);

  // Handle log set
  const handleLogSet = useCallback(
    (params: {
      plan_exercise_id: string;
      set_number: number;
      weight_kg: number;
      reps: number;
    }) => {
      if (!activeSession) return;
      logSetMutation.mutate(params);
    },
    [activeSession, logSetMutation]
  );

  // Handle finish workout
  const handleFinishWorkout = useCallback(() => {
    if (!activeSession || !clientId) return;

    completeSession.mutate(
      { sessionId: activeSession.id, clientId },
      {
        onSuccess: () => {
          setIsCompleted(true);
        },
      }
    );
  }, [activeSession, clientId, completeSession]);

  // Total sets logged
  const totalSetsLogged = loggedSets.length;
  const totalPrescribedSets = trainingDay.plan_exercises.reduce(
    (sum, pe) => sum + pe.prescribed_sets,
    0
  );

  // If completed, show summary
  if (isCompleted && activeSession) {
    return (
      <SessionSummary
        duration={elapsedSeconds}
        totalSetsLogged={totalSetsLogged}
        totalExercises={trainingDay.plan_exercises.length}
      />
    );
  }

  // Loading state while session is being created
  if (!activeSession) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Session timer header */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-background py-2">
        <h2 className="font-semibold text-lg">
          {trainingDay.day_label}
        </h2>
        <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
          <Timer className="h-4 w-4" />
          <span>{formattedTime}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{
            width: `${
              totalPrescribedSets > 0
                ? Math.min(
                    100,
                    (totalSetsLogged / totalPrescribedSets) * 100
                  )
                : 0
            }%`,
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {totalSetsLogged}/{totalPrescribedSets}{" "}
        {t("workout.setsLogged", "sets logged")}
      </p>

      {/* Exercise loggers */}
      <div className="space-y-3">
        {trainingDay.plan_exercises.map((pe, idx) => (
          <ExerciseLogger
            key={pe.id}
            planExercise={pe}
            prefillSets={lastSessionValues?.get(pe.id) ?? []}
            sessionId={activeSession.id}
            exerciseIndex={idx}
            totalExercises={trainingDay.plan_exercises.length}
            loggedSets={loggedSets}
            onLogSet={handleLogSet}
          />
        ))}
      </div>

      {/* Finish workout button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <Button
          className="w-full h-14 text-base font-semibold"
          onClick={handleFinishWorkout}
          disabled={completeSession.isPending}
        >
          {completeSession.isPending
            ? t("common.loading", "Loading...")
            : t("workout.finishWorkout", "Finish Workout")}
        </Button>
      </div>
    </div>
  );
}
