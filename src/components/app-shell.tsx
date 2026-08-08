"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cierra el drawer al navegar, sincroniza con el router (evento externo), no derivable durante el render
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen">
      <div
        aria-hidden="true"
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "fixed inset-0 z-20 bg-black/60 lg:hidden transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      <SidebarNav mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-10 flex items-center gap-3 px-4 h-14 bg-sidebar border-b border-sidebar-border shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            className="flex items-center justify-center w-9 h-9 rounded-lg text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-sm text-sidebar-primary tracking-tight">Aurora Creaciones</span>
        </header>

        <main className="flex-1 bg-background overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
