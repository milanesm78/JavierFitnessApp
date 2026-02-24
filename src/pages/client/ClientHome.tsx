import { useTranslation } from "react-i18next";
import { Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function ClientHome() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const displayName =
    user?.user_metadata?.full_name || user?.email || "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t("client.welcome_title", { name: displayName })}
        </h1>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Dumbbell className="h-16 w-16 text-muted-foreground" />
          <div className="text-center">
            <p className="text-lg font-medium">{t("client.welcome_message")}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("client.welcome_description")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
