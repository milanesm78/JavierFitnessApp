import { useTranslation } from "react-i18next";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Exercise } from "../types";

/**
 * Extract YouTube video ID from URL for thumbnail display.
 */
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com" ||
      parsed.hostname === "m.youtube.com"
    ) {
      const v = parsed.searchParams.get("v");
      if (v) return v;
      const pathMatch = parsed.pathname.match(
        /^\/(embed|shorts)\/([a-zA-Z0-9_-]+)/
      );
      if (pathMatch) return pathMatch[2];
    }
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.slice(1);
      if (id) return id;
    }
  } catch {
    // invalid URL
  }
  return null;
}

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
}

export function ExerciseCard({ exercise, onEdit, onDelete }: ExerciseCardProps) {
  const { t } = useTranslation();
  const videoId = extractYouTubeVideoId(exercise.youtube_url);

  return (
    <Card className="overflow-hidden">
      {/* YouTube Thumbnail */}
      {videoId && (
        <div className="relative">
          <img
            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
            alt={exercise.name}
            className="aspect-video w-full object-cover"
          />
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold leading-tight">
              {exercise.name}
            </h3>
            {exercise.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {exercise.description}
              </p>
            )}
            {exercise.default_weight_kg != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                {exercise.default_weight_kg} kg
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => onEdit(exercise)}
              aria-label={t("exercises.edit")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive hover:text-destructive"
              onClick={() => onDelete(exercise)}
              aria-label={t("common.delete")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
