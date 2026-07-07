import { useRouterState } from "@tanstack/react-router";
import { Bell, Home, PawPrint, ScanLine, User, Settings } from "lucide-react";
import type { ComponentType } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileMenuButton } from "./sidebar";

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
  const key = Object.keys(PAGE_META)
    .sort((a, b) => b.length - a.length)
    .find((k) => (k === "/" ? pathname === "/" : pathname.startsWith(k))) ?? "/";
  const meta = PAGE_META[key];
  const Icon = meta.icon;

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
          <button
            aria-label="Notifications"
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
          >
            <Bell className="h-4 w-4" />
          </button>
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
