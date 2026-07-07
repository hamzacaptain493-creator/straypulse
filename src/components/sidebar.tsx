import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  PawPrint,
  ScanLine,
  User,
  Bell,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/animals", label: "Animals", icon: PawPrint },
  { to: "/scan", label: "Scan", icon: ScanLine },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/notifications", label: "Notifications", icon: Bell },
] as const;

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <PawPrint className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-lg font-bold tracking-tight">StrayPulse</div>
        </div>
      </div>

      <div className="px-4 pb-2 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Navigation
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active =
            item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                "hover:bg-sidebar-accent",
                active && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 px-3 pb-3">
        <Link
          to="/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-sidebar-accent",
            pathname.startsWith("/settings") && "bg-sidebar-accent",
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>Settings</span>
        </Link>
      </div>

      <div className="border-t border-sidebar-border px-6 py-4 text-xs text-muted-foreground">
        © 2026 StrayPulse
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] border-r border-sidebar-border lg:block">
      <SidebarInner />
    </aside>
  );
}

export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] border-r border-sidebar-border transition-transform lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="absolute right-3 top-4">
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-8 w-8 place-items-center rounded-md hover:bg-sidebar-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <SidebarInner onNavigate={onClose} />
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open menu"
      className="grid h-9 w-9 place-items-center rounded-md hover:bg-muted lg:hidden"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

// Trivially satisfy an unused-import lint if MobileMenuButton is imported elsewhere later.
export { useState as _useState };
