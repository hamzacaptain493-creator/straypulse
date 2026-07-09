import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Activity,
  Heart,
  Thermometer,
  Battery,
  MapPin,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/lib/auth";
import {
  countAnimalFollowers,
  followAnimal,
  getAnimal,
  listFollowedAnimalIds,
  logAnimalInteraction,
  unfollowAnimal,
  type DbAnimal,
} from "@/lib/services";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/animals/$id")({
  component: AnimalDetailsPage,
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

function AnimalDetailsPage() {
  const { id } = useParams({ from: "/_app/animals/$id" });
  const { user } = useAuth();
  const [animal, setAnimal] = useState<DbAnimal | null>(null);
  const [followers, setFollowers] = useState(0);
  const [isFollowed, setIsFollowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const a = await getAnimal(id);
      setAnimal(a);
      if (a) {
        const [count, followedIds] = await Promise.all([
          countAnimalFollowers(a.id),
          user ? listFollowedAnimalIds(user.id) : Promise.resolve<string[]>([]),
        ]);
        setFollowers(count);
        setIsFollowed(followedIds.includes(a.id));
      }
    } catch (e) {
      console.error("getAnimal failed", e);
      setError(e instanceof Error ? e.message : "Failed to load animal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  const toggleFollow = async () => {
    if (!user || !animal || busy) return;
    setBusy(true);
    const wasFollowed = isFollowed;
    setIsFollowed(!wasFollowed);
    setFollowers((c) => c + (wasFollowed ? -1 : 1));
    try {
      if (wasFollowed) await unfollowAnimal(user.id, animal.id);
      else {
        await followAnimal(user.id, animal.id);
        await logAnimalInteraction(user.id, animal.id).catch(() => {});
      }
    } catch (e) {
      console.error("follow toggle failed", e);
      setIsFollowed(wasFollowed);
      setFollowers((c) => c + (wasFollowed ? 1 : -1));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading animal..." />;
  if (error) return <EmptyState title="Couldn't load animal" description={error} />;
  if (!animal) return <EmptyState title="Animal not found" />;

  const lat = animal.location_lat;
  const lng = animal.location_lng;
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  const bbox = hasCoords
    ? `${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}`
    : "";
  const marker = hasCoords ? `&marker=${lat}%2C${lng}` : "";
  const mapSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`
    : "";

  const battery = animal.oxygen_level; // Repurposed column as documented in services

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/animals">
          <ArrowLeft className="mr-2 h-4 w-4" /> All animals
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden p-0">
          <div className="aspect-[16/10] w-full bg-muted">
            {animal.image_url ? (
              <img src={animal.image_url} alt={animal.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-muted-foreground">
                <Activity className="h-10 w-10" />
              </div>
            )}
          </div>
          <div className="space-y-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-3xl font-bold">{animal.name}</h1>
                <p className="text-sm text-muted-foreground">{animal.species}</p>
              </div>
              <Badge
                className={cn(statusStyles[animal.health_status ?? "healthy"])}
                variant="secondary"
              >
                {statusLabel(animal.health_status)}
              </Badge>
            </div>
            {animal.description && (
              <p className="text-sm leading-relaxed">{animal.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat icon={Thermometer} label="Temp" value={animal.temperature != null ? `${animal.temperature}°C` : "—"} />
              <Stat icon={Heart} label="Heart rate" value={animal.heart_rate != null ? `${animal.heart_rate} bpm` : "—"} />
              <Stat icon={Battery} label="Battery" value={battery != null ? `${battery}%` : "—"} />
              <Stat icon={Users} label="Followers" value={String(followers)} />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={toggleFollow} disabled={!user || busy} variant={isFollowed ? "outline" : "default"}>
                {!user ? "Sign in to follow" : isFollowed ? "Following" : "Follow"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-3 p-5 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <MapPin className="h-4 w-4" /> Location
            </div>
            {hasCoords ? (
              <>
                <div className="overflow-hidden rounded-lg border border-border">
                  <iframe
                    title={`Map — ${animal.name}`}
                    src={mapSrc}
                    className="h-56 w-full"
                    loading="lazy"
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {lat!.toFixed(5)}, {lng!.toFixed(5)}
                </div>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Open in OpenStreetMap
                </a>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No GPS data yet.</p>
            )}
          </Card>

          <Card className="space-y-2 p-5 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <Clock className="h-4 w-4" /> Last update
            </div>
            <div className="text-xs text-muted-foreground">
              {animal.last_seen
                ? new Date(animal.last_seen).toLocaleString()
                : `Registered ${new Date(animal.created_at).toLocaleDateString()}`}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-muted p-3 text-center">
      <Icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}
