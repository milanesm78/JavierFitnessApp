import { useTranslation } from "react-i18next";
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import { extractYouTubeVideoId } from "@/lib/utils/youtube";

interface YouTubePlayerProps {
  youtubeUrl: string;
  exerciseName: string;
}

/**
 * Wrapper around react-lite-youtube-embed for exercise demonstration videos.
 * Uses extractYouTubeVideoId() to parse the URL.
 * Shows a visible fallback message if video ID extraction fails
 * (instead of returning null which causes blank space in CollapsibleContent).
 * noCookie mode for GDPR compliance.
 */
export function YouTubePlayer({ youtubeUrl, exerciseName }: YouTubePlayerProps) {
  const { t } = useTranslation();
  const videoId = extractYouTubeVideoId(youtubeUrl);

  if (!videoId) {
    return (
      <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        <p className="text-sm text-muted-foreground px-4 text-center">
          {t("plan.videoUnavailable", "Video unavailable")}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden">
      <LiteYouTubeEmbed
        id={videoId}
        title={exerciseName}
        poster="hqdefault"
        noCookie={true}
      />
    </div>
  );
}
