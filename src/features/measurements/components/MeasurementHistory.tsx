import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { ChevronDown, Plus, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useClientMeasurements } from "../hooks/useMeasurements";
import { MEASUREMENT_FIELDS, type BodyMeasurement } from "../types";

interface MeasurementHistoryProps {
  clientId: string;
  onNewMeasurement?: () => void;
}

type CategoryKey = keyof typeof MEASUREMENT_FIELDS;

function countRecordedFields(
  entry: BodyMeasurement,
  category: CategoryKey
): number {
  const fields = MEASUREMENT_FIELDS[category];
  return fields.filter(
    (f) => (entry as unknown as Record<string, unknown>)[f.name] != null
  ).length;
}

/**
 * List of past measurement entries as expandable cards.
 * Shows date, weight, height, and summary counts.
 * Expandable detail shows all recorded fields.
 */
export function MeasurementHistory({
  clientId,
  onNewMeasurement,
}: MeasurementHistoryProps) {
  const { t, i18n } = useTranslation();
  const { data: measurements, isPending } = useClientMeasurements(clientId);

  if (isPending) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-48 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const sorted = measurements ?? [];

  return (
    <div className="space-y-3">
      {/* Header with Add button */}
      {onNewMeasurement && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            {t("measurements.history", "History")}
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="min-h-[36px]"
            onClick={onNewMeasurement}
          >
            <Plus className="mr-1 h-4 w-4" />
            {t("measurements.newMeasurement")}
          </Button>
        </div>
      )}

      {/* Empty state */}
      {sorted.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <ClipboardList className="h-10 w-10 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">
              {t("progress.noMeasurements")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Measurement cards */}
      {sorted.map((entry, index) => {
        const prev = index < sorted.length - 1 ? sorted[index + 1] : null;
        return (
          <MeasurementCard
            key={entry.id}
            entry={entry}
            previous={prev}
            locale={i18n.language}
          />
        );
      })}
    </div>
  );
}

interface MeasurementCardProps {
  entry: BodyMeasurement;
  previous: BodyMeasurement | null;
  locale: string;
}

function MeasurementCard({ entry, previous, locale }: MeasurementCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const dateLocale = locale === "es" ? es : enUS;

  const formattedDate = (() => {
    try {
      return format(parseISO(entry.measured_at), "PPP", {
        locale: dateLocale,
      });
    } catch {
      return entry.measured_at;
    }
  })();

  // Count recorded optional fields by category
  const skinFoldCount = countRecordedFields(entry, "skinFolds");
  const diameterCount = countRecordedFields(entry, "boneDiameters");
  const circumferenceCount = countRecordedFields(entry, "circumferences");

  // Weight delta
  const weightDelta = previous ? entry.weight - previous.weight : null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <button className="w-full text-left">
            <CardContent className="flex items-center justify-between py-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">{formattedDate}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {entry.weight} kg
                    {weightDelta !== null && (
                      <span className="ml-1 text-xs">
                        ({weightDelta > 0 ? "+" : ""}
                        {weightDelta.toFixed(1)} kg)
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground/50">|</span>
                  <span>{entry.height} cm</span>
                </div>
                {(skinFoldCount > 0 ||
                  diameterCount > 0 ||
                  circumferenceCount > 0) && (
                  <p className="text-xs text-muted-foreground">
                    {t("measurements.fieldsRecorded", {
                      skinFolds: skinFoldCount,
                      diameters: diameterCount,
                      circumferences: circumferenceCount,
                    })}
                  </p>
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </CardContent>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t px-6 pb-4 pt-3">
            <MeasurementDetails entry={entry} />
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function MeasurementDetails({ entry }: { entry: BodyMeasurement }) {
  const { t } = useTranslation();

  const categories = [
    { key: "general" as const, label: t("measurements.general") },
    { key: "skinFolds" as const, label: t("measurements.skinFolds") },
    {
      key: "boneDiameters" as const,
      label: t("measurements.boneDiameters"),
    },
    {
      key: "circumferences" as const,
      label: t("measurements.circumferences"),
    },
  ];

  return (
    <div className="space-y-3">
      {categories.map((cat) => {
        const fields = MEASUREMENT_FIELDS[cat.key];
        const recordedFields = fields.filter(
          (f) =>
            (entry as unknown as Record<string, unknown>)[f.name] != null
        );
        if (recordedFields.length === 0) return null;

        return (
          <div key={cat.key}>
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              {cat.label}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {recordedFields.map((f) => {
                const value = (entry as unknown as Record<string, unknown>)[
                  f.name
                ];
                return (
                  <div key={f.name} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t(
                        `measurements.${f.name}` as
                          | "measurements.weight"
                          | "measurements.height"
                          | "measurements.skinfold_triceps"
                          | "measurements.skinfold_subscapular"
                          | "measurements.skinfold_suprailiac"
                          | "measurements.skinfold_abdominal"
                          | "measurements.skinfold_thigh"
                          | "measurements.skinfold_calf"
                          | "measurements.diameter_humeral"
                          | "measurements.diameter_femoral"
                          | "measurements.diameter_bistyloidal"
                          | "measurements.circ_arm_relaxed"
                          | "measurements.circ_arm_flexed"
                          | "measurements.circ_chest"
                          | "measurements.circ_waist"
                          | "measurements.circ_hip"
                          | "measurements.circ_thigh"
                          | "measurements.circ_calf"
                      )}
                    </span>
                    <span>
                      {String(value)} {f.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {entry.notes && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
            {t("measurements.notes")}
          </p>
          <p className="text-sm">{entry.notes}</p>
        </div>
      )}
    </div>
  );
}
