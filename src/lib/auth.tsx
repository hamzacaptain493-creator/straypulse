import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  loading: true,
  isGuest: false,
  signOut: async () => {},
});

// TEMP: while auth is disabled we auto-sign-in as a Supabase anonymous user
// (so RLS policies scoped to auth.uid() still let writes through). If the
// project has anonymous sign-ins disabled we fall back to a mock user for
// read-only browsing. Flip to `false` to restore the real login flow.
export const DEV_MODE_BYPASS_AUTH = true;

const DEV_MOCK_USER = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "guest@straypulse.local",
  user_metadata: { name: "Guest" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as unknown as User;

async function ensureProfile(user: User) {
  try {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (existing) return;
    const pendingName =
      (typeof window !== "undefined" && window.localStorage.getItem("pending_profile_name")) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email ||
      "Guest";
    const { error } = await supabase.from("profiles").upsert({ id: user.id, name: pendingName });
    if (error) {
      console.error("ensureProfile upsert failed", error);
      return;
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("pending_profile_name");
    }
  } catch (err) {
    console.error("ensureProfile error", err);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [guestFallback, setGuestFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data.session) {
        setSession(data.session);
        setLoading(false);
        void ensureProfile(data.session.user);
        return;
      }

      if (!DEV_MODE_BYPASS_AUTH) {
        setLoading(false);
        return;
      }

      // No session yet — try Supabase anonymous sign-in so writes work under RLS.
      try {
        const { data: anon, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        if (!mounted) return;
        setSession(anon.session);
        if (anon.user) void ensureProfile(anon.user);
      } catch (err) {
        console.warn("Anonymous sign-in unavailable — falling back to guest mock user.", err);
        if (mounted) setGuestFallback(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && s?.user) {
        setTimeout(() => void ensureProfile(s.user), 0);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? (guestFallback ? DEV_MOCK_USER : null);
  const isGuest = DEV_MODE_BYPASS_AUTH && (guestFallback || !!session?.user?.is_anonymous);

  return (
    <Ctx.Provider
      value={{
        session,
        user,
        loading,
        isGuest,
        signOut: async () => {
          if (!DEV_MODE_BYPASS_AUTH) await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
