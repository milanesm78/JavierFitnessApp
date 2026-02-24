import { useTranslation } from "react-i18next";
import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function PendingActivationPage() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      {/* Top controls */}
      <div className="absolute right-4 top-4 flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-6 py-12">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Clock className="h-10 w-10 text-muted-foreground" />
          </div>

          <div className="text-center">
            <h1 className="text-xl font-bold">{t("auth.pending_title")}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("auth.pending_message")}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("auth.pending_reassurance")}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => signOut()}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            {t("auth.logout")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
