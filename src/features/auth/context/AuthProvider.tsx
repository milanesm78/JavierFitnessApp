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

const VALID_ROLES: ReadonlySet<string> = new Set(["trainer", "client"]);

function isValidRole(value: unknown): value is UserRole {
  return typeof value === "string" && VALID_ROLES.has(value);
}

/**
 * Resolve the user role using a multi-tier fallback strategy:
 *
 * 1. JWT custom claim `user_role` (injected by custom_access_token_hook) -- instant, no network
 * 2. Supabase user_metadata.role (set during signUp via options.data) -- instant, no network
 * 3. profiles table lookup (always has the role from handle_new_user trigger) -- requires DB query
 *
 * This ensures login works whether or not the custom_access_token_hook
 * is enabled on the hosted Supabase project.
 */
function decodeRoleFromJwt(accessToken: string): UserRole | null {
  try {
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    if (isValidRole(payload.user_role)) return payload.user_role;
  } catch {
    // Fall through to return null
  }
  return null;
}

function getRoleFromMetadata(user: User): UserRole | null {
  const metaRole = user.user_metadata?.role;
  return isValidRole(metaRole) ? metaRole : null;
}

interface ProfileData {
  role: UserRole | null;
  isActive: boolean | null;
}

async function fetchProfile(userId: string): Promise<ProfileData> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", userId)
      .single();

    if (error || !data) return { role: null, isActive: null };
    return {
      role: isValidRole(data.role) ? data.role : null,
      isActive: data.is_active,
    };
  } catch {
    return { role: null, isActive: null };
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

      // Multi-tier role resolution: JWT claim -> user_metadata -> profiles table
      let role = decodeRoleFromJwt(newSession.access_token);
      if (!role) {
        role = getRoleFromMetadata(newSession.user);
      }

      // Always fetch the profile for is_active status.
      // If role is still null, the profile query also resolves it (tier 3).
      const profile = await fetchProfile(newSession.user.id);
      if (!role) {
        role = profile.role;
      }

      setUserRole(role);
      setIsActive(profile.isActive);
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

    // Listen for auth changes.
    // IMPORTANT: The callback must NOT be async and must NOT return a promise.
    // Supabase's _notifyAllSubscribers() awaits each callback's return value.
    // If the callback returned a promise, signInWithPassword/signUp would block
    // until processSession completes (including DB queries), causing the submit
    // button to get stuck. Using `void` ensures the callback returns undefined.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setIsLoading(true);
      void processSession(newSession).finally(() => setIsLoading(false));
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
