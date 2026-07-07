import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PawPrint, Grid3x3, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const [tab, setTab] = useState("posts");

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="grid h-32 w-32 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
          <PawPrint className="h-14 w-14" />
        </div>
        <div className="flex-1 space-y-4 text-center sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <h1 className="text-2xl font-bold">StrayPulse</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Edit Profile</Button>
              <Button variant="outline" size="sm">Settings</Button>
            </div>
          </div>

          <div className="flex justify-center gap-8 sm:justify-start">
            <Stat value="0" label="Posts" />
            <Stat value="0" label="Followed" />
            <Stat value="0" label="Paw Score" />
          </div>

          <p className="text-sm">Passionate about helping stray animals 🐾</p>

          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Badge variant="secondary" className="uppercase tracking-wider">
              Animal Lover
            </Badge>
            <Badge variant="secondary" className="uppercase tracking-wider">
              Stray Helper
            </Badge>
          </div>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-center">
          <TabsTrigger value="posts" className="gap-2">
            <Grid3x3 className="h-4 w-4" /> Posts
          </TabsTrigger>
          <TabsTrigger value="followed" className="gap-2">
            <UserPlus className="h-4 w-4" /> Followed
          </TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          <EmptyState icon={Grid3x3} title="No posts yet" />
        </TabsContent>
        <TabsContent value="followed">
          <EmptyState icon={UserPlus} title="No animals followed yet" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
