"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FileText, ClipboardList, Users, Package,
  Boxes, UserCircle, LogOut, BarChart3, Sparkles, type LucideIcon,
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
      <div className="px-6 py-6 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-sidebar-primary shrink-0">
            <Sparkles size={13} className="text-sidebar-primary-foreground" />
          </span>
          <h1 className="font-heading text-xl font-semibold tracking-tight text-sidebar-foreground leading-none">
            Aurora Creaciones
          </h1>
        </div>
        <p className="text-xs text-sidebar-foreground/55 mt-1.5 pl-9">Productos personalizados</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const active = isItemActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onMobileClose?.()}
              className={cn(
                "relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-full bg-sidebar-primary-foreground/40" />
              )}
              <Icon size={16} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border shrink-0">
        {session?.user && (
          <div className="flex items-center gap-2.5 mb-3 px-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-linear-to-br from-sidebar-primary to-clientes-soft text-sidebar-primary-foreground font-heading font-semibold text-sm shrink-0">
              {session.user.name?.[0]?.toUpperCase() ?? <UserCircle size={16} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{session.user.name}</p>
              <span className="inline-block mt-0.5 text-[10px] font-medium capitalize text-sidebar-primary-foreground bg-sidebar-primary/70 px-1.5 py-0.5 rounded-full">
                {session.user.rol ?? "usuario"}
              </span>
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
