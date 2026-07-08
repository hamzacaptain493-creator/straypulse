import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { AnimalCard, type Animal } from "@/components/animal-card";
import { EmptyState } from "@/components/empty-state";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/animals")({
  component: AnimalsPage,
});

type DbAnimal = {
  id: string;
  name: string;
  species: string;
  description: string | null;
  image_url: string | null;
  health_status: string | null;
  heart_rate: number | null;
  temperature: number | null;
  oxygen_level: number | null;
};

function mapStatus(s: string | null): Animal["status"] {
  if (s === "critical") return "Critical";
  if (s === "needs_attention" || s === "attention") return "Needs attention";
  return "Healthy";
}

function toAnimal(r: DbAnimal): Animal {
  return {
    id: r.id,
    name: r.name,
    species: r.species,
    age: r.description ?? "—",
    status: mapStatus(r.health_status),
    temperature: r.temperature != null ? `${r.temperature}°C` : "—",
    heartRate: r.heart_rate != null ? `${r.heart_rate} bpm` : "—",
    battery: r.oxygen_level ?? 0,
    photo: r.image_url ?? undefined,
  };
}

function AnimalsPage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("animals")
        .select("id,name,species,description,image_url,health_status,heart_rate,temperature,oxygen_level")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) setError(error.message);
      else setAnimals((data as DbAnimal[]).map(toAnimal));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        <EmptyState title="No animals yet" description="Be the first to register a stray." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {animals.map((a) => (
            <AnimalCard key={a.id} animal={a} />
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
