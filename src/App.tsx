import { Routes, Route, Navigate } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/features/auth/hooks/useAuth";

// Pages
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { TrainerDashboard } from "@/pages/trainer/TrainerDashboard";
import { ClientHome } from "@/pages/client/ClientHome";
import { PendingActivationPage } from "@/pages/client/PendingActivationPage";

// Layouts
import { TrainerLayout } from "@/layouts/TrainerLayout";
import { ClientLayout } from "@/layouts/ClientLayout";

function RootRedirect() {
  const { session, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (session && userRole) {
    return (
      <Navigate to={userRole === "trainer" ? "/trainer" : "/client"} replace />
    );
  }

  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Trainer routes */}
        <Route
          element={<ProtectedRoute allowedRoles={["trainer"]} />}
        >
          <Route element={<TrainerLayout />}>
            <Route path="/trainer" element={<TrainerDashboard />} />
            <Route
              path="/trainer/exercises"
              element={
                <div className="text-muted-foreground">
                  Exercise library coming in Plan 03...
                </div>
              }
            />
          </Route>
        </Route>

        {/* Client routes (require activation) */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["client"]} requireActive={true} />
          }
        >
          <Route element={<ClientLayout />}>
            <Route path="/client" element={<ClientHome />} />
          </Route>
        </Route>

        {/* Client pending route (no activation required) */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["client"]}
              requireActive={false}
            />
          }
        >
          <Route path="/client/pending" element={<PendingActivationPage />} />
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
