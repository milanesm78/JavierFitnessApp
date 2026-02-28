import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ChartEmptyStateProps {
  message: string;
}

/**
 * Informative empty state shown when chart has fewer than 2 data points.
 * Reusable across strength and body measurement charts.
 */
export function ChartEmptyState({ message }: ChartEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
        <TrendingUp className="h-10 w-10 text-muted-foreground" />
        <p className="text-center text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
