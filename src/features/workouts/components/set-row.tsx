import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Save, Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeDecimal, formatWeight } from "@/lib/utils";

interface SetRowProps {
  setNumber: number;
  prefillWeight: number;
  prefillReps: number;
  onLog: (weight: number, reps: number) => void;
  isLogged: boolean;
}

/**
 * Single set input row with stepper controls optimized for gym use.
 * Weight stepper: -2.5 / value / +2.5
 * Reps stepper: -1 / value / +1
 * Large 48px touch targets for sweaty hands.
 */
export function SetRow({
  setNumber,
  prefillWeight,
  prefillReps,
  onLog,
  isLogged,
}: SetRowProps) {
  const { t, i18n } = useTranslation();
  const [weight, setWeight] = useState(prefillWeight);
  const [reps, setReps] = useState(prefillReps);

  const handleWeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = normalizeDecimal(e.target.value);
      if (val !== null && val >= 0) setWeight(val);
      else if (e.target.value === "") setWeight(0);
    },
    []
  );

  const handleRepsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val >= 0) setReps(val);
      else if (e.target.value === "") setReps(0);
    },
    []
  );

  const handleLog = useCallback(() => {
    onLog(weight, reps);
  }, [onLog, weight, reps]);

  return (
    <div
      className={`flex items-center gap-2 min-h-[56px] rounded-lg px-2 py-1.5 ${
        isLogged ? "bg-primary/5" : ""
      }`}
    >
      {/* Set number label */}
      <span className="text-xs text-muted-foreground w-6 text-center shrink-0">
        {setNumber}
      </span>

      {/* Weight stepper */}
      <div className="flex items-center gap-0.5 flex-1">
        <Button
          type="button"
          variant="outline"
          className="h-12 w-12 p-0 shrink-0"
          onClick={() => setWeight((w) => Math.max(0, w - 2.5))}
          disabled={isLogged}
          aria-label={t("workout.decreaseWeight", "Decrease weight")}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center flex-1 min-w-0">
          <input
            type="text"
            inputMode="decimal"
            value={isLogged ? formatWeight(weight, i18n.language) : weight}
            onChange={handleWeightChange}
            disabled={isLogged}
            className="w-full text-center text-sm font-medium bg-transparent border-0 outline-none disabled:opacity-100"
            aria-label={t("workout.weight", "Weight")}
          />
          <span className="text-[10px] text-muted-foreground">
            {t("workout.kg", "kg")}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-12 p-0 shrink-0"
          onClick={() => setWeight((w) => w + 2.5)}
          disabled={isLogged}
          aria-label={t("workout.increaseWeight", "Increase weight")}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Reps stepper */}
      <div className="flex items-center gap-0.5 flex-1">
        <Button
          type="button"
          variant="outline"
          className="h-12 w-12 p-0 shrink-0"
          onClick={() => setReps((r) => Math.max(0, r - 1))}
          disabled={isLogged}
          aria-label={t("workout.decreaseReps", "Decrease reps")}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center flex-1 min-w-0">
          <input
            type="text"
            inputMode="numeric"
            value={reps}
            onChange={handleRepsChange}
            disabled={isLogged}
            className="w-full text-center text-sm font-medium bg-transparent border-0 outline-none disabled:opacity-100"
            aria-label={t("workout.reps", "Reps")}
          />
          <span className="text-[10px] text-muted-foreground">
            {t("workout.reps", "reps")}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-12 p-0 shrink-0"
          onClick={() => setReps((r) => r + 1)}
          disabled={isLogged}
          aria-label={t("workout.increaseReps", "Increase reps")}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Log button */}
      <Button
        type="button"
        variant={isLogged ? "default" : "outline"}
        className={`h-12 w-12 rounded-full p-0 shrink-0 ${
          isLogged
            ? "bg-green-600 hover:bg-green-600 text-white border-green-600"
            : ""
        }`}
        onClick={handleLog}
        disabled={isLogged}
        aria-label={
          isLogged
            ? t("workout.logged", "Set logged")
            : t("workout.logSet", "Log set")
        }
      >
        {isLogged ? (
          <Check className="h-5 w-5" />
        ) : (
          <Save className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
