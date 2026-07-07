import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_app/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-4xl font-bold tracking-tight">Notifications</h1>
      <EmptyState
        icon={Bell}
        title="No notifications yet"
        description="You'll be notified when animals you follow need attention."
      />
    </div>
  );
}
