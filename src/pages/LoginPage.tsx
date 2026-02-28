import { Navigate } from "react-router";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function LoginPage() {
  const { session, userRole, isLoading } = useAuth();

  if (!isLoading && session) {
    return (
      <Navigate
        to={userRole === "trainer" ? "/trainer" : "/client"}
        replace
      />
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <LanguageToggle />
      </div>
      <div className="flex w-full flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">JavierFitness</h1>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
