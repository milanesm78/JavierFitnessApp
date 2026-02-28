import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClientMeasurements } from "@/features/measurements/hooks/useMeasurements";
import {
  CHART_COLORS,
  MEASUREMENT_CHART_FIELDS,
  toChartData,
  formatChartDate,
  formatTooltipDate,
} from "../utils/chartHelpers";
import { ChartEmptyState } from "./ChartEmptyState";

interface MeasurementChartProps {
  clientId: string;
}

/**
 * Line chart showing body measurement trends over time.
 * Includes field selector grouped by category.
 */
export function MeasurementChart({ clientId }: MeasurementChartProps) {
  const { t, i18n } = useTranslation();
  const [selectedField, setSelectedField] = useState("weight");

  const { data: measurements, isPending } = useClientMeasurements(clientId);

  const locale = i18n.language;
  const fieldMeta = MEASUREMENT_CHART_FIELDS.find(
    (f) => f.key === selectedField
  );
  const unit = fieldMeta?.unit ?? "";

  const chartData = measurements ? toChartData(measurements, selectedField) : [];

  // Group fields by category for the selector
  const categories = [
    { key: "general", label: t("measurements.general") },
    { key: "skinFolds", label: t("measurements.skinFolds") },
    { key: "boneDiameters", label: t("measurements.boneDiameters") },
    { key: "circumferences", label: t("measurements.circumferences") },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Field selector grouped by category */}
      <Select value={selectedField} onValueChange={setSelectedField}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("progress.selectMeasurement")} />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => {
            const fields = MEASUREMENT_CHART_FIELDS.filter(
              (f) => f.category === cat.key
            );
            if (fields.length === 0) return null;
            return (
              <SelectGroup key={cat.key}>
                <SelectLabel>{cat.label}</SelectLabel>
                {fields.map((f) => (
                  <SelectItem key={f.key} value={f.key}>
                    {t(f.labelKey as "measurements.weight")} ({f.unit})
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>

      {/* Loading state */}
      {isPending && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      )}

      {/* Chart or empty state */}
      {!isPending && chartData.length < 2 && (
        <ChartEmptyState message={t("progress.needMoreData")} />
      )}

      {!isPending && chartData.length >= 2 && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => formatChartDate(d, locale)}
              interval="preserveStartEnd"
              fontSize={12}
            />
            <YAxis unit={` ${unit}`} fontSize={12} />
            <Tooltip
              labelFormatter={(d) => formatTooltipDate(d as string, locale)}
              formatter={(value) => [
                `${value} ${unit}`,
                t(
                  (fieldMeta?.labelKey ??
                    "measurements.weight") as "measurements.weight"
                ),
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={CHART_COLORS[1]}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
