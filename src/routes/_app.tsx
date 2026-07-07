import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar, MobileSidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  // Hydrate theme on mount
  useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="lg:pl-[280px]">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
