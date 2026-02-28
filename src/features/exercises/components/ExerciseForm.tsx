import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DecimalInput } from "@/components/DecimalInput";
import type { Exercise, ExerciseFormData } from "../types";

/**
 * Extract YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
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
      // /watch?v=ID
      const v = parsed.searchParams.get("v");
      if (v) return v;
      // /embed/ID or /shorts/ID
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

function isValidYouTubeUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com" ||
      parsed.hostname === "m.youtube.com" ||
      parsed.hostname === "youtu.be"
    );
  } catch {
    return false;
  }
}

interface ExerciseFormProps {
  exercise?: Exercise;
  onSubmit: (data: ExerciseFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function ExerciseForm({
  exercise,
  onSubmit,
  onCancel,
  isLoading,
}: ExerciseFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(exercise?.name ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(exercise?.youtube_url ?? "");
  const [description, setDescription] = useState(exercise?.description ?? "");
  const [defaultWeight, setDefaultWeight] = useState<number | null>(
    exercise?.default_weight_kg ?? null
  );
  const [errors, setErrors] = useState<{ name?: string; youtube_url?: string }>(
    {}
  );

  useEffect(() => {
    if (exercise) {
      setName(exercise.name);
      setYoutubeUrl(exercise.youtube_url);
      setDescription(exercise.description ?? "");
      setDefaultWeight(exercise.default_weight_kg ?? null);
    }
  }, [exercise]);

  const videoId = extractYouTubeVideoId(youtubeUrl);

  function validate(): boolean {
    const newErrors: { name?: string; youtube_url?: string } = {};
    if (!name.trim()) {
      newErrors.name = t("exercises.name_required");
    }
    if (!youtubeUrl.trim()) {
      newErrors.youtube_url = t("exercises.url_required");
    } else if (!isValidYouTubeUrl(youtubeUrl)) {
      newErrors.youtube_url = t("exercises.url_invalid");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      youtube_url: youtubeUrl.trim(),
      description: description.trim(),
      default_weight_kg: defaultWeight !== null ? String(defaultWeight) : "",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="exercise-name">{t("exercises.name")}</Label>
        <Input
          id="exercise-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          placeholder={t("exercises.name_placeholder")}
          className="min-h-[44px]"
          disabled={isLoading}
          autoFocus
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="exercise-youtube">{t("exercises.youtube_url")}</Label>
        <Input
          id="exercise-youtube"
          value={youtubeUrl}
          onChange={(e) => {
            setYoutubeUrl(e.target.value);
            if (errors.youtube_url)
              setErrors((prev) => ({ ...prev, youtube_url: undefined }));
          }}
          placeholder={t("exercises.url_placeholder")}
          className="min-h-[44px]"
          disabled={isLoading}
        />
        {errors.youtube_url && (
          <p className="text-sm text-destructive">{errors.youtube_url}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="exercise-description">{t("exercises.description")}</Label>
        <Textarea
          id="exercise-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("exercises.description_placeholder")}
          className="min-h-[80px]"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exercise-default-weight">
          {t("exercises.default_weight")}
        </Label>
        <DecimalInput
          id="exercise-default-weight"
          value={defaultWeight}
          onChange={setDefaultWeight}
          placeholder={t("exercises.default_weight_placeholder")}
          disabled={isLoading}
        />
      </div>

      {/* YouTube thumbnail preview */}
      {videoId && (
        <div className="overflow-hidden rounded-md border">
          <img
            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
            alt={t("exercises.video_preview")}
            className="aspect-video w-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="min-h-[44px]"
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading} className="min-h-[44px]">
          {isLoading
            ? t("common.loading")
            : exercise
              ? t("exercises.save")
              : t("exercises.add")}
        </Button>
      </div>
    </form>
  );
}
