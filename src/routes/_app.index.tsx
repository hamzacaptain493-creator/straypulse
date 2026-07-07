import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <EmptyState title="No posts yet." />
    </div>
  );
}
