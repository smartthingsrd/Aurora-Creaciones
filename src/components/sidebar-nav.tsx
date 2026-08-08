"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FileText, ClipboardList, Users, Package,
  Boxes, UserCircle, LogOut, BarChart3, type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  isActive?: (pathname: string) => boolean;
};

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/facturas", label: "Facturas", icon: FileText },
  { href: "/cotizaciones", label: "Cotizaciones", icon: ClipboardList },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/recursos", label: "Recursos", icon: Boxes, adminOnly: true },
  { href: "/reportes", label: "Reportes", icon: BarChart3, adminOnly: true },
  { href: "/usuarios", label: "Usuarios", icon: UserCircle, adminOnly: true },
];

function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.isActive) return item.isActive(pathname);
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export function SidebarNav({
  mobileOpen = false,
  onMobileClose,
}: {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = ["dueña", "admin"].includes(session?.user?.rol ?? "");

  const visibleItems = ITEMS.filter(i => !i.adminOnly || isAdmin);

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-30 flex flex-col bg-sidebar text-sidebar-foreground",
      "w-[80vw] max-w-[280px]",
      "transition-transform duration-300 ease-in-out",
      "lg:relative lg:z-auto lg:w-64 lg:shrink-0 lg:translate-x-0",
      mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
    )}>
      <div className="px-6 py-5 border-b border-sidebar-border shrink-0">
        <h1 className="text-lg font-bold tracking-tight text-sidebar-primary">Aurora Creaciones</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-0.5">Productos personalizados</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const active = isItemActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onMobileClose?.()}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon size={16} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border shrink-0">
        {session?.user && (
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center shrink-0">
              <UserCircle size={16} className="text-sidebar-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{session.user.name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate capitalize">{session.user.rol ?? "usuario"}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut size={13} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
