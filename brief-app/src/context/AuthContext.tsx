import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type UserRole = "admin" | "staff";

export type UserProfile = {
  id: string;
  firm_id: string;
  role: UserRole;
  full_name: string;
  created_at: string;
};

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Initial session + auth listener. Callback stays synchronous.
  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (!data.session) setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        // Synchronous only. No async call here — that deadlocks supabase-js.
        if (cancelled) return;
        setSession(newSession);
        if (!newSession) {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 2. Profile fetch, separate from the auth callback.
  useEffect(() => {
    if (!session?.user.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .from("user_profiles")
      .select("id, firm_id, role, full_name, created_at")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setProfile(null);
        } else {
          setProfile(data as UserProfile);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}