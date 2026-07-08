import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useAuth } from "@/lib/auth";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type DbNotification,
} from "@/lib/services";

export const Route = createFileRoute("/_app/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<DbNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setItems(await listNotifications(user.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const markAll = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    load();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Notifications</h1>
        {user && items.some((i) => !i.read) && (
          <Button variant="outline" onClick={markAll}>
            <Check className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {!user ? (
        <EmptyState icon={Bell} title="Sign in to see notifications" />
      ) : loading ? (
        <LoadingSpinner label="Loading..." />
      ) : error ? (
        <EmptyState icon={Bell} title="Couldn't load notifications" description={error} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You'll be notified when animals you follow need attention."
        />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <Card
              key={n.id}
              className={`flex items-start gap-4 p-4 ${!n.read ? "border-primary/40 bg-primary/5" : ""}`}
              onClick={() => !n.read && markNotificationRead(n.id).then(load)}
              role="button"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted">
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {n.type}
                </div>
                <div className="text-sm">{n.message}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
              {!n.read && <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
