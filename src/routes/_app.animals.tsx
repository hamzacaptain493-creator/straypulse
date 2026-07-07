import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { AnimalCard, type Animal } from "@/components/animal-card";

export const Route = createFileRoute("/_app/animals")({
  component: AnimalsPage,
});

function AnimalsPage() {
  // Wire this up to Supabase later. Empty means "loading" state per spec.
  const [animals] = useState<Animal[]>([]);
  const [loading] = useState(true);

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
