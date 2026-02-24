import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AuthContextValue, UserRole } from "../types";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeRoleFromJwt(accessToken: string): UserRole | null {
  try {
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    return (payload.user_role as UserRole) ?? null;
  } catch {
    return null;
  }
}

async function fetchActivationStatus(userId: string): Promise<boolean | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", userId)
      .single();

    if (error || !data) return null;
    return data.is_active;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const processSession = useCallback(async (newSession: Session | null) => {
    setSession(newSession);

    if (newSession?.user) {
      setUser(newSession.user);

      const role = decodeRoleFromJwt(newSession.access_token);
      setUserRole(role);

      const activeStatus = await fetchActivationStatus(newSession.user.id);
      setIsActive(activeStatus);
    } else {
      setUser(null);
      setUserRole(null);
      setIsActive(null);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initial } }) => {
      await processSession(initial);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      await processSession(newSession);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [processSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      role: UserRole
    ) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });
      if (error) throw error;
    },
    []
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userRole,
        isActive,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
