import { supabase } from "@/lib/supabase";

/* ============ Types (mirror actual DB columns) ============ */
export type DbAnimal = {
  id: string;
  name: string;
  species: string;
  description: string | null;
  image_url: string | null;
  health_status: string | null;
  heart_rate: number | null;
  temperature: number | null;
  oxygen_level: number | null;
  location_lat: number | null;
  location_lng: number | null;
  last_seen: string | null;
  created_at: string;
};

export type DbPost = {
  id: string;
  user_id: string;
  animal_id: string | null;
  title: string | null;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type DbProfile = {
  id: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type DbComment = {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
};

export type DbNotification = {
  id: string;
  user_id: string;
  animal_id: string | null;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
};

export type DbFollow = {
  id: string;
  user_id: string;
  animal_id: string;
  created_at: string;
};

export type DbPostInteraction = {
  id: string;
  user_id: string;
  post_id: string;
  liked: boolean;
  created_at: string;
};

export type DbUserPreferences = {
  id: string;
  user_id: string;
  theme_mode: string | null;
  updated_at: string;
};

export type DbModerationLog = {
  id: string;
  moderator_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string | null;
  created_at: string;
};

export type DbUserRole = { id: string; user_id: string; role: string };

/* ============ Animals ============ */
export async function listAnimals() {
  const { data, error } = await supabase
    .from("animals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbAnimal[];
}
export async function getAnimal(id: string) {
  const { data, error } = await supabase.from("animals").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as DbAnimal | null;
}
export async function countAnimalFollowers(animalId: string) {
  const { count, error } = await supabase
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("animal_id", animalId);
  if (error) throw error;
  return count ?? 0;
}
export async function getDashboardStats() {
  const [{ count: total, error: e1 }, { count: healthy, error: e2 }, { count: critical, error: e3 }, { count: users, error: e4 }] =
    await Promise.all([
      supabase.from("animals").select("id", { count: "exact", head: true }),
      supabase.from("animals").select("id", { count: "exact", head: true }).eq("health_status", "healthy"),
      supabase.from("animals").select("id", { count: "exact", head: true }).eq("health_status", "critical"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);
  if (e1 || e2 || e3 || e4) {
    const err = e1 || e2 || e3 || e4;
    throw err;
  }
  return {
    total: total ?? 0,
    healthy: healthy ?? 0,
    critical: critical ?? 0,
    users: users ?? 0,
  };
}
export async function countUnreadNotifications(userId: string) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
  return count ?? 0;
}

/* ============ Posts ============ */
export async function listPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbPost[];
}
export async function getPost(id: string) {
  const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as DbPost | null;
}
export async function createPost(input: {
  user_id: string;
  animal_id?: string | null;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
}) {
  const { data, error } = await supabase.from("posts").insert(input).select().single();
  if (error) throw error;
  return data as DbPost;
}
export async function deletePost(id: string) {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

/* ============ Profiles ============ */
export async function getProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data as DbProfile | null;
}
export async function upsertProfile(p: Partial<DbProfile> & { id: string }) {
  const { data, error } = await supabase.from("profiles").upsert(p).select().single();
  if (error) throw error;
  return data as DbProfile;
}
export async function listProfilesByIds(ids: string[]) {
  if (ids.length === 0) return [] as DbProfile[];
  const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
  if (error) throw error;
  return (data ?? []) as DbProfile[];
}

/* ============ Comments ============ */
export async function listComments(postId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbComment[];
}
export async function createComment(input: { user_id: string; post_id: string; content: string }) {
  const { data, error } = await supabase.from("comments").insert(input).select().single();
  if (error) throw error;
  return data as DbComment;
}
export async function deleteComment(id: string) {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
}

/* ============ Notifications ============ */
export async function listNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbNotification[];
}
export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw error;
}
export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
}

/* ============ Follows (users follow animals) ============ */
export async function listFollowedAnimalIds(userId: string) {
  const { data, error } = await supabase.from("follows").select("animal_id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.animal_id as string);
}
export async function followAnimal(userId: string, animalId: string) {
  const { error } = await supabase.from("follows").insert({ user_id: userId, animal_id: animalId });
  if (error) throw error;
}
export async function unfollowAnimal(userId: string, animalId: string) {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("user_id", userId)
    .eq("animal_id", animalId);
  if (error) throw error;
}

/* ============ Post interactions (likes) ============ */
export async function listPostLikes(postId: string) {
  const { data, error } = await supabase
    .from("post_interactions")
    .select("*")
    .eq("post_id", postId)
    .eq("liked", true);
  if (error) throw error;
  return (data ?? []) as DbPostInteraction[];
}
export async function toggleLike(userId: string, postId: string, like: boolean) {
  if (like) {
    const { error } = await supabase
      .from("post_interactions")
      .upsert({ user_id: userId, post_id: postId, liked: true }, { onConflict: "user_id,post_id" });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("post_interactions")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", postId);
    if (error) throw error;
  }
}
export async function hasLiked(userId: string, postId: string) {
  const { data, error } = await supabase
    .from("post_interactions")
    .select("id")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .eq("liked", true)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/* ============ Animal interactions ============ */
export async function logAnimalInteraction(userId: string, animalId: string) {
  const { error } = await supabase
    .from("animal_interactions")
    .insert({ user_id: userId, animal_id: animalId });
  if (error) throw error;
}
export async function listAnimalInteractions(animalId: string) {
  const { data, error } = await supabase
    .from("animal_interactions")
    .select("*")
    .eq("animal_id", animalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/* ============ User preferences ============ */
export async function getUserPreferences(userId: string) {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as DbUserPreferences | null;
}
export async function upsertUserPreferences(userId: string, theme_mode: string) {
  const { error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: userId, theme_mode }, { onConflict: "user_id" });
  if (error) throw error;
}

/* ============ Roles / Moderation ============ */
export async function getUserRoles(userId: string) {
  const { data, error } = await supabase.from("user_roles").select("*").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as DbUserRole[];
}
export async function listModerationLogs() {
  const { data, error } = await supabase
    .from("moderation_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as DbModerationLog[];
}
