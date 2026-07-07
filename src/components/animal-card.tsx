import { Heart, Thermometer, Activity, Battery } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type Animal = {
  id: string;
  name: string;
  species: string;
  age: string;
  status: "Healthy" | "Needs attention" | "Critical";
  temperature: string;
  heartRate: string;
  battery: number;
  photo?: string;
};

const statusStyles: Record<Animal["status"], string> = {
  Healthy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  "Needs attention":
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  Critical: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
};

export function AnimalCard({ animal }: { animal: Animal }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="aspect-[4/3] w-full bg-muted">
        {animal.photo ? (
          <img
            src={animal.photo}
            alt={animal.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <Activity className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">{animal.name}</h3>
            <p className="truncate text-sm text-muted-foreground">
              {animal.species} · {animal.age}
            </p>
          </div>
          <Badge className={statusStyles[animal.status]} variant="secondary">
            {animal.status}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-muted p-2">
            <Thermometer className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <div className="font-medium">{animal.temperature}</div>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <Heart className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <div className="font-medium">{animal.heartRate}</div>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <Battery className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <div className="font-medium">{animal.battery}%</div>
          </div>
        </div>

        <Button className="w-full">Follow</Button>
      </div>
    </Card>
  );
}
