import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Play, ChevronDown, ChevronUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SetRow } from "./set-row";
import { YouTubePlayer } from "./youtube-player";
import type { PlanExerciseWithDetails } from "@/features/plans/types";
import type { WorkoutSet } from "../types";

interface ExerciseLoggerProps {
  planExercise: PlanExerciseWithDetails;
  prefillSets: { weight_kg: number; reps: number }[];
  sessionId: string;
  exerciseIndex: number;
  totalExercises: number;
  loggedSets: WorkoutSet[];
  onLogSet: (params: {
    plan_exercise_id: string;
    set_number: number;
    weight_kg: number;
    reps: number;
  }) => void;
}

/**
 * Per-exercise logging interface showing all sets for one exercise.
 * Uses accordion-style expand so client can scroll back to review previous exercises.
 * Shows progress indicator for logged sets.
 */
export function ExerciseLogger({
  planExercise,
  prefillSets,
  exerciseIndex,
  totalExercises,
  loggedSets,
  onLogSet,
}: ExerciseLoggerProps) {
  const { t } = useTranslation();
  const [showVideo, setShowVideo] = useState(false);
  const [isExpanded, setIsExpanded] = useState(exerciseIndex === 0);

  const setsCount = planExercise.prescribed_sets;

  // Count how many sets have been logged for this exercise
  const loggedCount = useMemo(
    () =>
      loggedSets.filter((s) => s.plan_exercise_id === planExercise.id).length,
    [loggedSets, planExercise.id]
  );

  // Check which set numbers are logged
  const loggedSetNumbers = useMemo(() => {
    const nums = new Set<number>();
    for (const s of loggedSets) {
      if (s.plan_exercise_id === planExercise.id) {
        nums.add(s.set_number);
      }
    }
    return nums;
  }, [loggedSets, planExercise.id]);

  const handleLogSet = (setNumber: number, weight: number, reps: number) => {
    onLogSet({
      plan_exercise_id: planExercise.id,
      set_number: setNumber,
      weight_kg: weight,
      reps: reps,
    });
  };

  const allSetsLogged = loggedCount >= setsCount;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Exercise header */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between p-3 min-h-[48px] text-left"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {exerciseIndex + 1}/{totalExercises}
                </span>
                <p className="font-medium text-sm">
                  {planExercise.exercises.name}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {loggedCount}/{setsCount}{" "}
                {t("workout.setsLogged", "sets logged")}
                {allSetsLogged && " \u2713"}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {planExercise.exercises.youtube_url && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVideo((v) => !v);
                  }}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  aria-label={
                    showVideo
                      ? t("plan.hideVideo", "Hide video")
                      : t("plan.showVideo", "Show video")
                  }
                >
                  <Play className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* YouTube video (behind tap) */}
        {showVideo && planExercise.exercises.youtube_url && (
          <div className="px-3 pb-3">
            <YouTubePlayer
              youtubeUrl={planExercise.exercises.youtube_url}
              exerciseName={planExercise.exercises.name}
            />
          </div>
        )}

        {/* Set rows */}
        <CollapsibleContent>
          <div className="px-2 pb-2 space-y-1">
            {Array.from({ length: setsCount }, (_, i) => {
              const setNumber = i + 1;
              // Pre-fill priority: last session actual values first, falls back to prescribed
              const prefill = prefillSets[i];
              const prefillWeight =
                prefill?.weight_kg ?? planExercise.prescribed_weight_kg;
              const prefillReps =
                prefill?.reps ?? planExercise.prescribed_reps;

              return (
                <SetRow
                  key={setNumber}
                  setNumber={setNumber}
                  prefillWeight={prefillWeight}
                  prefillReps={prefillReps}
                  onLog={(weight, reps) =>
                    handleLogSet(setNumber, weight, reps)
                  }
                  isLogged={loggedSetNumbers.has(setNumber)}
                />
              );
            })}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
