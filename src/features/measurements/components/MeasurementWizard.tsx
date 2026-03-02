import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { measurementSchema, type MeasurementFormValues } from "../schemas";
import {
  MEASUREMENT_FIELDS,
  type MeasurementCategory,
} from "../types";
import { useCreateMeasurement, useLatestMeasurement } from "../hooks/useMeasurements";
import { MeasurementStepSection } from "./MeasurementStepSection";
import type { BodyMeasurement } from "../types";

interface MeasurementWizardProps {
  clientId: string;
  previousMeasurement?: BodyMeasurement | null;
}

const STEPS: { category: MeasurementCategory; labelKey: string }[] = [
  { category: "general", labelKey: "measurements.general" },
  { category: "skinFolds", labelKey: "measurements.skinFolds" },
  { category: "boneDiameters", labelKey: "measurements.boneDiameters" },
  { category: "circumferences", labelKey: "measurements.circumferences" },
];

/** Map step category to the form field names that belong to it */
function getStepFieldNames(category: MeasurementCategory): string[] {
  return MEASUREMENT_FIELDS[category].map((f) => f.name);
}

export function MeasurementWizard({
  clientId,
}: MeasurementWizardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const { data: latestMeasurement } = useLatestMeasurement(clientId);
  const createMeasurement = useCreateMeasurement();

  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      weight: undefined as unknown as number,
      height: undefined as unknown as number,
      skinfold_triceps: null,
      skinfold_subscapular: null,
      skinfold_suprailiac: null,
      skinfold_abdominal: null,
      skinfold_thigh: null,
      skinfold_calf: null,
      diameter_humeral: null,
      diameter_femoral: null,
      diameter_bistyloidal: null,
      circ_arm_relaxed: null,
      circ_arm_flexed: null,
      circ_chest: null,
      circ_waist: null,
      circ_hip: null,
      circ_thigh: null,
      circ_calf: null,
      notes: "",
      measured_at: new Date().toISOString(),
    },
  });

  const step = STEPS[currentStep];
  const totalSteps = STEPS.length;
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = async () => {
    const fieldNames = getStepFieldNames(step.category);
    const valid = await form.trigger(
      fieldNames as (keyof MeasurementFormValues)[]
    );
    if (valid) {
      setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLastStep) {
      e.preventDefault();
    }
  };

  const onSubmit = (data: MeasurementFormValues) => {
    if (!isLastStep) return;
    createMeasurement.mutate(
      { clientId, data },
      {
        onSuccess: () => {
          navigate(`/trainer/clients/${clientId}`);
        },
      }
    );
  };

  /** Get previous value for a field from the latest measurement */
  const getPreviousValue = (fieldName: string): number | null => {
    if (!latestMeasurement) return null;
    const val = (latestMeasurement as unknown as Record<string, unknown>)[fieldName];
    return typeof val === "number" ? val : null;
  };

  /** Build field config for the current step */
  const stepFields = MEASUREMENT_FIELDS[step.category].map((field) => ({
    name: field.name,
    label: t(`measurements.${field.name}` as never),
    unit: field.unit,
    previousValue: getPreviousValue(field.name),
  }));

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="space-y-6">
      {/* Progress indicator */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          {t("measurements.step", {
            current: currentStep + 1,
            total: totalSteps,
          })}{" "}
          - {t(step.labelKey as never)}
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <MeasurementStepSection
        title={t(step.labelKey as never)}
        fields={stepFields}
        control={form.control}
      />

      {/* Navigation buttons */}
      <div className="flex gap-3">
        {currentStep > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="min-h-[48px] flex-1"
          >
            {t("measurements.back")}
          </Button>
        )}
        {isLastStep ? (
          <Button
            type="submit"
            disabled={createMeasurement.isPending}
            className="min-h-[48px] flex-1"
          >
            {createMeasurement.isPending
              ? t("common.loading")
              : t("measurements.save")}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleNext}
            className="min-h-[48px] flex-1"
          >
            {t("measurements.next")}
          </Button>
        )}
      </div>
    </form>
  );
}
