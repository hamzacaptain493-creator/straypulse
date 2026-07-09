import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { EmptyState } from "@/components/empty-state";
import { useAuth, DEV_MODE_BYPASS_AUTH } from "@/lib/auth";
import { getUserRoles, listModerationLogs, type DbModerationLog } from "@/lib/services";

export const Route = createFileRoute("/_app/moderation")({
  component: ModerationPage,
});

function ModerationPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DbModerationLog[]>([]);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (DEV_MODE_BYPASS_AUTH) {
          setAllowed(true);
          setLogs(await listModerationLogs());
          return;
        }
        if (!user) return;
        const roles = await getUserRoles(user.id);
        const ok = roles.some((r) => r.role === "admin" || r.role === "moderator");
        setAllowed(ok);
        if (ok) setLogs(await listModerationLogs());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user) return <EmptyState icon={Shield} title="Sign in required" />;
  if (loading) return <LoadingSpinner label="Loading..." />;
  if (!allowed)
    return <EmptyState icon={Shield} title="Access denied" description="Moderators only." />;
  if (error) return <EmptyState icon={Shield} title="Error" description={error} />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-4xl font-bold tracking-tight">Moderation</h1>
      {logs.length === 0 ? (
        <EmptyState icon={Shield} title="No moderation activity yet" />
      ) : (
        <div className="space-y-3">
          {logs.map((l) => (
            <Card key={l.id} className="p-4 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-semibold uppercase tracking-wider">{l.action}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleString()}
                </div>
              </div>
              <div className="mt-1 text-muted-foreground">
                {l.target_type} · {l.target_id}
              </div>
              {l.details && <div className="mt-2">{l.details}</div>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
