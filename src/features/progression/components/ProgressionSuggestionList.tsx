import { useTranslation } from "react-i18next";
import { TrendingUp } from "lucide-react";
import { usePendingSuggestions } from "../hooks/useProgression";
import { ProgressionSuggestionCard } from "./ProgressionSuggestionCard";

interface ProgressionSuggestionListProps {
  clientId: string;
}

/**
 * List of pending progression suggestions for a client.
 * Renders nothing if there are no pending suggestions (clean UI).
 * Used in both the post-workout summary and the trainer client detail view.
 */
export function ProgressionSuggestionList({
  clientId,
}: ProgressionSuggestionListProps) {
  const { t } = useTranslation();
  const { data: suggestions, isPending } = usePendingSuggestions(clientId);

  // Don't render anything while loading or if no suggestions
  if (isPending || !suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-green-500" />
        <h3 className="font-semibold text-sm">
          {t("progression.pending_suggestions", "Progression Suggestions")}
        </h3>
      </div>
      {suggestions.map((suggestion) => (
        <ProgressionSuggestionCard key={suggestion.id} suggestion={suggestion} />
      ))}
    </div>
  );
}
