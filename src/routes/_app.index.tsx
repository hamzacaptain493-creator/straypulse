import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, PawPrint, Plus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/loading-spinner";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/lib/auth";
import {
  createComment,
  createPost,
  deletePost,
  hasLiked,
  listComments,
  listPosts,
  listProfilesByIds,
  toggleLike,
  type DbComment,
  type DbPost,
  type DbProfile,
} from "@/lib/services";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});

function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [profiles, setProfiles] = useState<Record<string, DbProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listPosts();
      setPosts(rows);
      const ids = Array.from(new Set(rows.map((p) => p.user_id)));
      const profs = await listProfilesByIds(ids);
      setProfiles(Object.fromEntries(profs.map((p) => [p.id, p])));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Home feed</h1>
          <p className="text-sm text-muted-foreground">
            Latest updates from the StrayPulse community.
          </p>
        </div>
        {user && (
          <Button onClick={() => setShowComposer((v) => !v)}>
            <Plus className="mr-2 h-4 w-4" />
            New post
          </Button>
        )}
      </div>

      {!user && (
        <Card className="p-5 text-sm">
          <Link to="/auth" className="font-medium text-primary hover:underline">
            Sign in
          </Link>{" "}
          to create posts, comment, and like.
        </Card>
      )}

      {user && showComposer && (
        <PostComposer
          userId={user.id}
          onCreated={() => {
            setShowComposer(false);
            load();
          }}
        />
      )}

      {loading ? (
        <LoadingSpinner label="Loading feed..." />
      ) : error ? (
        <EmptyState title="Couldn't load posts" description={error} />
      ) : posts.length === 0 ? (
        <EmptyState title="No posts yet" description="Be the first to post." />
      ) : (
        <div className="space-y-6">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              profile={profiles[p.user_id]}
              onChanged={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostComposer({ userId, onCreated }: { userId: string; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!description.trim() && !title.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await createPost({
        user_id: userId,
        title: title || null,
        description: description || null,
        image_url: imageUrl || null,
      });
      setTitle("");
      setDescription("");
      setImageUrl("");
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-3 p-5">
      <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea
        placeholder="What's happening?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        placeholder="Image URL (optional)"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex justify-end">
        <Button onClick={submit} disabled={busy}>
          {busy ? "Posting..." : "Post"}
        </Button>
      </div>
    </Card>
  );
}

function PostCard({
  post,
  profile,
  onChanged,
}: {
  post: DbPost;
  profile?: DbProfile;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<DbComment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const loadInteractions = async () => {
    const { count } = await supabase
      .from("post_interactions")
      .select("id", { count: "exact", head: true })
      .eq("post_id", post.id)
      .eq("liked", true);
    setLikeCount(count ?? 0);
    if (user) setLiked(await hasLiked(user.id, post.id));
  };
  const loadComments = async () => setComments(await listComments(post.id));

  useEffect(() => {
    loadInteractions();
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id, user?.id]);

  const onLike = async () => {
    if (!user) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      await toggleLike(user.id, post.id, next);
    } catch {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    }
  };

  const onComment = async () => {
    if (!user || !commentText.trim()) return;
    await createComment({ user_id: user.id, post_id: post.id, content: commentText.trim() });
    setCommentText("");
    loadComments();
  };

  const onDelete = async () => {
    if (!user || user.id !== post.user_id) return;
    if (!confirm("Delete this post?")) return;
    await deletePost(post.id);
    onChanged();
  };

  const displayName = profile?.name ?? "Anonymous";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center gap-3 p-5">
        <Avatar className="h-10 w-10">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} />
          ) : (
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{displayName}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(post.created_at).toLocaleString()}
          </div>
        </div>
        {user?.id === post.user_id && (
          <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete post">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {post.title && <div className="px-5 pb-2 text-lg font-semibold">{post.title}</div>}
      {post.description && (
        <div className="px-5 pb-4 text-sm whitespace-pre-wrap">{post.description}</div>
      )}
      {post.image_url && (
        <img src={post.image_url} alt="" className="w-full object-cover" />
      )}

      <div className="flex items-center gap-4 border-t border-border px-5 py-3">
        <button
          onClick={onLike}
          disabled={!user}
          className="flex items-center gap-1.5 text-sm hover:text-primary disabled:opacity-50"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`} />
          <span>{likeCount}</span>
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-sm hover:text-primary"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{comments.length}</span>
        </button>
        {post.animal_id && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
            <PawPrint className="h-3 w-3" /> Tagged animal
          </span>
        )}
      </div>

      {showComments && (
        <div className="space-y-3 border-t border-border bg-muted/30 p-5">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="text-sm">
                <span className="font-medium">User</span>{" "}
                <span className="text-muted-foreground">
                  · {new Date(c.created_at).toLocaleString()}
                </span>
                <div>{c.content}</div>
              </div>
            ))
          )}
          {user && (
            <div className="flex gap-2 pt-2">
              <Input
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onComment()}
              />
              <Button size="icon" onClick={onComment} aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
