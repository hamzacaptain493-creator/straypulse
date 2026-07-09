import { useRouterState, Link } from "@tanstack/react-router";
import { Bell, Home, PawPrint, ScanLine, User, Settings } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileMenuButton } from "./sidebar";
import { useAuth } from "@/lib/auth";
import { countUnreadNotifications } from "@/lib/services";
import { supabase } from "@/lib/supabase";

const PAGE_META: Record<string, { title: string; icon: ComponentType<{ className?: string }> }> = {
  "/": { title: "Home", icon: Home },
  "/animals": { title: "Animals", icon: PawPrint },
  "/scan": { title: "Scan", icon: ScanLine },
  "/profile": { title: "Profile", icon: User },
  "/notifications": { title: "Notifications", icon: Bell },
  "/settings": { title: "Settings", icon: Settings },
};

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  const key = Object.keys(PAGE_META)
    .sort((a, b) => b.length - a.length)
    .find((k) => (k === "/" ? pathname === "/" : pathname.startsWith(k))) ?? "/";
  const meta = PAGE_META[key];
  const Icon = meta.icon;

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const c = await countUnreadNotifications(user.id);
        if (!cancelled) setUnread(c);
      } catch (e) {
        console.error("unread notifications failed", e);
      }
    };
    load();
    const channel = supabase
      .channel(`notifications-badge-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <header className="sticky top-0 z-20 h-[72px] border-b border-border bg-background/80 backdrop-blur">
      <div className="flex h-full items-center gap-3 px-6">
        <MobileMenuButton onClick={onMenuClick} />
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted">
            <Icon className="h-4 w-4" />
          </div>
          <h1 className="truncate text-lg font-semibold">{meta.title}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              SP
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
