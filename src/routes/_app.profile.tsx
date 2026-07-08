import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PawPrint, Grid3x3, UserPlus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useAuth } from "@/lib/auth";
import {
  getProfile,
  listAnimals,
  listFollowedAnimalIds,
  listPosts,
  upsertProfile,
  type DbAnimal,
  type DbPost,
  type DbProfile,
} from "@/lib/services";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AnimalCard, type Animal } from "@/components/animal-card";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function mapAnimal(a: DbAnimal): Animal {
  const status: Animal["status"] =
    a.health_status === "critical"
      ? "Critical"
      : a.health_status === "needs_attention"
        ? "Needs attention"
        : "Healthy";
  return {
    id: a.id,
    name: a.name,
    species: a.species,
    age: a.description ?? "—",
    status,
    temperature: a.temperature != null ? `${a.temperature}°C` : "—",
    heartRate: a.heart_rate != null ? `${a.heart_rate} bpm` : "—",
    battery: a.oxygen_level ?? 0,
    photo: a.image_url ?? undefined,
  };
}

function ProfilePage() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState("posts");
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [myPosts, setMyPosts] = useState<DbPost[]>([]);
  const [followed, setFollowed] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const p = await getProfile(user.id);
      setProfile(p);
      setName(p?.name ?? "");
      setBio(p?.bio ?? "");
      const allPosts = await listPosts();
      setMyPosts(allPosts.filter((x) => x.user_id === user.id));
      const followedIds = await listFollowedAnimalIds(user.id);
      const animals = await listAnimals();
      setFollowed(animals.filter((a) => followedIds.includes(a.id)).map(mapAnimal));
      setLoading(false);
    })();
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl">
        <EmptyState
          icon={PawPrint}
          title="Sign in to view your profile"
          action={
            <Link to="/auth">
              <Button>Sign in</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const saveProfile = async () => {
    await upsertProfile({ id: user.id, name, bio });
    const p = await getProfile(user.id);
    setProfile(p);
    setEditing(false);
  };

  const displayName = profile?.name || user.email || "You";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="grid h-32 w-32 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span className="text-4xl font-bold">{initials}</span>
          )}
        </div>
        <div className="flex-1 space-y-4 text-center sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
                {editing ? "Cancel" : "Edit Profile"}
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" />
              <Button size="sm" onClick={saveProfile}>
                Save
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-8 sm:justify-start">
                <Stat value={String(myPosts.length)} label="Posts" />
                <Stat value={String(followed.length)} label="Followed" />
                <Stat value={String(myPosts.length * 5)} label="Paw Score" />
              </div>
              <p className="text-sm">{profile?.bio || "No bio yet."}</p>
              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge variant="secondary" className="uppercase tracking-wider">
                  Animal Lover
                </Badge>
              </div>
            </>
          )}
        </div>
      </header>

      {loading ? (
        <LoadingSpinner label="Loading profile..." />
      ) : (
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
            {myPosts.length === 0 ? (
              <EmptyState icon={Grid3x3} title="No posts yet" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myPosts.map((p) => (
                  <div key={p.id} className="overflow-hidden rounded-xl border border-border">
                    {p.image_url && (
                      <img src={p.image_url} alt="" className="aspect-square w-full object-cover" />
                    )}
                    <div className="p-3 text-sm">
                      {p.title && <div className="font-semibold">{p.title}</div>}
                      {p.description && (
                        <div className="line-clamp-2 text-muted-foreground">{p.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="followed">
            {followed.length === 0 ? (
              <EmptyState icon={UserPlus} title="No animals followed yet" />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {followed.map((a) => (
                  <AnimalCard key={a.id} animal={a} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
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
