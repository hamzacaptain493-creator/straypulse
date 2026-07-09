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


export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) void ensureProfile(data.session.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && s?.user) {
        // Defer so we don't block the auth callback.
        setTimeout(() => void ensureProfile(s.user), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
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
