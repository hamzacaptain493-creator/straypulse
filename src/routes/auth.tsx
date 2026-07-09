import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate({ to: "/" });
  }, [session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name: name || email },
          },
        });
        if (error) throw error;

        // Stash desired name so we can upsert the profile once a session exists.
        if (typeof window !== "undefined") {
          window.localStorage.setItem("pending_profile_name", name || email);
        }

        if (data.session && data.user) {
          // Session active immediately — safe to write under RLS.
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({ id: data.user.id, name: name || email });
          if (profileError) throw profileError;
        } else {
          // No session yet: email confirmation required. Do NOT insert into profiles (RLS 401).
          setError(
            "Check your email to confirm your account. You'll be signed in after confirming.",
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <PawPrint className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">
            {mode === "signin" ? "Welcome back" : "Join StrayPulse"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}
          </Button>
        </form>

        <div className="text-center text-sm">
          {mode === "signin" ? (
            <button className="text-primary hover:underline" onClick={() => setMode("signup")}>
              Don't have an account? Sign up
            </button>
          ) : (
            <button className="text-primary hover:underline" onClick={() => setMode("signin")}>
              Already have an account? Sign in
            </button>
          )}
        </div>
        <div className="text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">
            Continue browsing without an account
          </Link>
        </div>
      </Card>
    </div>
  );
}
