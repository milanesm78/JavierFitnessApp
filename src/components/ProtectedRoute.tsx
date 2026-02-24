import { Navigate, Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { UserRole } from "@/features/auth/types";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  requireActive?: boolean;
}

export function ProtectedRoute({
  allowedRoles,
  requireActive = true,
}: ProtectedRouteProps) {
  const { session, userRole, isActive, isLoading } = useAuth();
  const { t } = useTranslation();

  // Show loading while initial auth check is in progress
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // Not authenticated: redirect to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Role check: wrong portal
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    const redirectPath = userRole === "trainer" ? "/trainer" : "/client";
    return <Navigate to={redirectPath} replace />;
  }

  // Activation check: inactive client trying to access active-only route
  if (
    requireActive &&
    userRole === "client" &&
    isActive === false
  ) {
    return <Navigate to="/client/pending" replace />;
  }

  return <Outlet />;
}
