import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
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
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useActivePlan } from "@/features/plans/hooks/usePlans";
import { WorkoutSession } from "@/features/workouts/components/workout-session";

/**
 * Page for active workout logging.
 * Route: /client/workout/:trainingDayId
 * Full-screen layout (no bottom nav) for maximum screen space.
 * Back button with confirmation dialog if session is in progress.
 */
export function WorkoutPage() {
  const { trainingDayId } = useParams<{ trainingDayId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const { data: plan, isLoading } = useActivePlan(userId);

  // Find the training day from the plan
  const trainingDay = plan?.training_days.find(
    (d) => d.id === trainingDayId
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (!trainingDay || !trainingDayId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <p className="text-muted-foreground mb-4">
          {t("workout.notFound", "Training day not found.")}
        </p>
        <Button variant="outline" onClick={() => navigate("/client/plan")}>
          {t("workout.backToPlan", "Back to plan")}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("workout.leaveTitle", "Leave workout?")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t(
                    "workout.leaveConfirm",
                    "Your logged sets are saved, but the session will remain incomplete."
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("workout.stayHere", "Stay")}
                </AlertDialogCancel>
                <AlertDialogAction onClick={() => navigate("/client/plan")}>
                  {t("workout.leave", "Leave")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <h1 className="text-lg font-semibold ml-2">
            {trainingDay.day_label}
          </h1>
        </div>
      </header>

      {/* Workout session */}
      <main className="px-4 py-4">
        <WorkoutSession
          trainingDayId={trainingDayId}
          trainingDay={trainingDay}
        />
      </main>
    </div>
  );
}
