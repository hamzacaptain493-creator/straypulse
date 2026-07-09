import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

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
      null;
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, name: pendingName });
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


// TEMP: Development mode — bypass authentication so every page is accessible
// without login. Flip to `false` (or remove) to restore real auth.
export const DEV_MODE_BYPASS_AUTH = true;

const DEV_MOCK_USER = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "dev@straypulse.local",
  user_metadata: { name: "Dev User" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as unknown as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEV_MODE_BYPASS_AUTH) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) void ensureProfile(data.session.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && s?.user) {
        setTimeout(() => void ensureProfile(s.user), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const user = DEV_MODE_BYPASS_AUTH ? DEV_MOCK_USER : session?.user ?? null;

  return (
    <Ctx.Provider
      value={{
        session,
        user,
        loading,
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
