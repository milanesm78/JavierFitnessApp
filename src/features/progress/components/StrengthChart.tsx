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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStrengthProgress } from "../hooks/useStrengthProgress";
import {
  CHART_COLORS,
  formatChartDate,
  formatTooltipDate,
} from "../utils/chartHelpers";
import { ChartEmptyState } from "./ChartEmptyState";

interface ExerciseOption {
  id: string;
  name: string;
}

interface StrengthChartProps {
  clientId: string;
  exercises: ExerciseOption[];
}

/**
 * Line chart showing strength progress (max weight) per exercise over time.
 * Includes exercise selector dropdown and handles loading/empty states.
 */
export function StrengthChart({ clientId, exercises }: StrengthChartProps) {
  const { t, i18n } = useTranslation();
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    exercises[0]?.id ?? ""
  );

  const { data, isPending } = useStrengthProgress(
    clientId,
    selectedExerciseId
  );

  const locale = i18n.language;

  return (
    <div className="space-y-4">
      {/* Exercise selector */}
      <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("progress.selectExercise")} />
        </SelectTrigger>
        <SelectContent>
          {exercises.map((ex) => (
            <SelectItem key={ex.id} value={ex.id}>
              {ex.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Loading state */}
      {isPending && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      )}

      {/* Chart or empty state */}
      {!isPending && (!data || data.length < 2) && (
        <ChartEmptyState message={t("progress.needMoreData")} />
      )}

      {!isPending && data && data.length >= 2 && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => formatChartDate(d, locale)}
              interval="preserveStartEnd"
              fontSize={12}
            />
            <YAxis unit=" kg" fontSize={12} />
            <Tooltip
              labelFormatter={(d) => formatTooltipDate(d as string, locale)}
              formatter={(value) => [
                `${value} kg`,
                t("progress.maxWeight"),
              ]}
            />
            <Line
              type="monotone"
              dataKey="max_weight"
              stroke={CHART_COLORS[0]}
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
