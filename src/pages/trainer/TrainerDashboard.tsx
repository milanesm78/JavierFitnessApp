import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Profile } from "@/types/database";

const clientKeys = {
  all: ["clients"] as const,
  list: () => [...clientKeys.all, "list"] as const,
};

export function TrainerDashboard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: clients,
    isPending,
    error,
  } = useQuery({
    queryKey: clientKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "client")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
  });

  const toggleActivation = useMutation({
    mutationFn: async ({
      clientId,
      activate,
    }: {
      clientId: string;
      activate: boolean;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: activate })
        .eq("id", clientId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.list() });
      toast.success(
        variables.activate
          ? t("trainer.client_activated")
          : t("trainer.client_deactivated")
      );
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("trainer.dashboard_title")}</h1>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-destructive">{t("common.error")}</p>
          </CardContent>
        </Card>
      )}

      {clients && clients.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Users className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">{t("trainer.no_clients")}</p>
              <p className="text-sm text-muted-foreground">
                {t("trainer.no_clients_description")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {clients && clients.length > 0 && (
        <div className="space-y-3">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base font-medium">
                    {client.full_name || client.email}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {client.email}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      client.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {client.is_active
                      ? t("trainer.status_active")
                      : t("trainer.status_pending")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-end">
                  {client.is_active ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toggleActivation.mutate({
                          clientId: client.id,
                          activate: false,
                        })
                      }
                      disabled={toggleActivation.isPending}
                    >
                      {t("trainer.deactivate")}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() =>
                        toggleActivation.mutate({
                          clientId: client.id,
                          activate: true,
                        })
                      }
                      disabled={toggleActivation.isPending}
                    >
                      {t("trainer.activate")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
