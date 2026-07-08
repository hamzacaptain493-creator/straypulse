import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Thermometer, Activity, Battery, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/lib/auth";
import {
  followAnimal,
  listAnimals,
  listFollowedAnimalIds,
  logAnimalInteraction,
  unfollowAnimal,
  type DbAnimal,
} from "@/lib/services";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/animals")({
  component: AnimalsPage,
});

const statusStyles: Record<string, string> = {
  healthy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  needs_attention: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  critical: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
};

function statusLabel(s: string | null) {
  if (s === "critical") return "Critical";
  if (s === "needs_attention") return "Needs attention";
  return "Healthy";
}

function AnimalsPage() {
  const { user } = useAuth();
  const [animals, setAnimals] = useState<DbAnimal[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await listAnimals();
      setAnimals(rows);
      if (user) {
        const ids = await listFollowedAnimalIds(user.id);
        setFollowed(new Set(ids));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load animals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const toggleFollow = async (id: string) => {
    if (!user) return;
    const isFollowed = followed.has(id);
    const next = new Set(followed);
    if (isFollowed) next.delete(id);
    else next.add(id);
    setFollowed(next);
    try {
      if (isFollowed) await unfollowAnimal(user.id, id);
      else await followAnimal(user.id, id);
      await logAnimalInteraction(user.id, id).catch(() => {});
    } catch {
      // revert
      const revert = new Set(followed);
      setFollowed(revert);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Animal Profiles</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Discover and follow stray animals in your area. Help them by monitoring
          their health and wellbeing.
        </p>
      </header>

      {loading ? (
        <LoadingSpinner label="Loading animals..." />
      ) : error ? (
        <EmptyState title="Couldn't load animals" description={error} />
      ) : animals.length === 0 ? (
        <EmptyState title="No animals yet" />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {animals.map((a) => (
            <AnimalCardDb
              key={a.id}
              a={a}
              followed={followed.has(a.id)}
              onFollow={() => toggleFollow(a.id)}
              canFollow={!!user}
            />
          ))}
        </div>
      )}

      <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Want to add a new animal?</h3>
          <p className="text-sm text-muted-foreground">
            Help others by registering strays you've spotted.
          </p>
        </div>
        <Button className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Animal
        </Button>
      </Card>
    </div>
  );
}

function AnimalCardDb({
  a,
  followed,
  onFollow,
  canFollow,
}: {
  a: DbAnimal;
  followed: boolean;
  onFollow: () => void;
  canFollow: boolean;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="aspect-[4/3] w-full bg-muted">
        {a.image_url ? (
          <img src={a.image_url} alt={a.name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <Activity className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">{a.name}</h3>
            <p className="truncate text-sm text-muted-foreground">
              {a.species}
              {a.description ? ` · ${a.description}` : ""}
            </p>
          </div>
          <Badge
            className={cn(statusStyles[a.health_status ?? "healthy"])}
            variant="secondary"
          >
            {statusLabel(a.health_status)}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-muted p-2">
            <Thermometer className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <div className="font-medium">
              {a.temperature != null ? `${a.temperature}°C` : "—"}
            </div>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <Heart className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <div className="font-medium">
              {a.heart_rate != null ? `${a.heart_rate} bpm` : "—"}
            </div>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <Battery className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <div className="font-medium">
              {a.oxygen_level != null ? `${a.oxygen_level}%` : "—"}
            </div>
          </div>
        </div>

        <Button
          className="w-full"
          variant={followed ? "outline" : "default"}
          onClick={onFollow}
          disabled={!canFollow}
        >
          {!canFollow ? "Sign in to follow" : followed ? "Following" : "Follow"}
        </Button>
      </div>
    </Card>
  );
}
