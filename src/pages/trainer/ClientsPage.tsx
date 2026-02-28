import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useClientDashboard } from "@/features/dashboard/hooks/useDashboard";

const clientKeys = {
  all: ["clients"] as const,
  list: () => [...clientKeys.all, "list"] as const,
};

function WorkoutStatusDot({
  status,
}: {
  status: "completed" | "in_progress" | "not_started";
}) {
  const colors = {
    completed: "bg-green-500",
    in_progress: "bg-amber-500",
    not_started: "bg-gray-400",
  };

  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status]}`}
    />
  );
}

export function ClientsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: clients, isPending, error } = useClientDashboard();

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
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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

  const filtered = useMemo(() => {
    if (!clients) return [];
    if (!searchQuery.trim()) return clients;
    const lower = searchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        c.full_name.toLowerCase().includes(lower) ||
        c.email.toLowerCase().includes(lower)
    );
  }, [clients, searchQuery]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      inactive:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };
    const labels: Record<string, string> = {
      active: t("trainer.status_active"),
      pending: t("trainer.status_pending"),
      inactive: t("status.inactive", "Inactive"),
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.inactive}`}
      >
        {labels[status] ?? status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">
          {t("trainer.dashboard_title", "Client Management")}
        </h1>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("plans.searchClients", "Search clients...")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 min-h-[44px]"
        />
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

      {filtered.length === 0 && !isPending && !error && (
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

      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((client) => (
            <Card
              key={client.client_id}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => navigate(`/trainer/clients/${client.client_id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-medium truncate">
                    {client.full_name || client.email}
                  </CardTitle>
                  <CardDescription className="text-sm truncate">
                    {client.email}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <WorkoutStatusDot status={client.today_workout_status} />
                  {getStatusBadge(client.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-end">
                  {client.status === "active" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActivation.mutate({
                          clientId: client.client_id,
                          activate: false,
                        });
                      }}
                      disabled={toggleActivation.isPending}
                    >
                      {t("trainer.deactivate")}
                    </Button>
                  ) : client.status === "pending" ? (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActivation.mutate({
                          clientId: client.client_id,
                          activate: true,
                        });
                      }}
                      disabled={toggleActivation.isPending}
                    >
                      {t("trainer.activate")}
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
