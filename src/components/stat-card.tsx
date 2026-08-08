import Link from "next/link";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

export type StatCardVariant = "default" | "success" | "warning" | "danger" | "info" | "purple" | "rose" | "muted";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  variant?: StatCardVariant;
  href?: string;
  badge?: string;
  className?: string;
};

// Cada variante = un color de identidad del ERP (ver globals.css: --ventas,
// --beneficio, --productos, --clientes, --cotizaciones, --alerta). info=Ventas,
// success=Beneficio, rose=Productos, purple=Clientes, warning=Cotizaciones,
// danger=alertas. Un solo patrón bg-suave/tono-legible en vez de colores sueltos.
const VARIANTS: Record<StatCardVariant, {
  card: string; iconWrap: string; valueColor: string; badgeColor: string; accent: string;
}> = {
  default: { card: "border-border",         iconWrap: "bg-primary/8 text-primary",         valueColor: "text-foreground", badgeColor: "bg-primary/10 text-primary",             accent: "bg-primary" },
  success: { card: "border-beneficio/25",   iconWrap: "bg-beneficio-soft text-beneficio",  valueColor: "text-foreground", badgeColor: "bg-beneficio-soft text-beneficio",       accent: "bg-beneficio" },
  warning: { card: "border-cotizaciones/25",iconWrap: "bg-cotizaciones-soft text-cotizaciones", valueColor: "text-foreground", badgeColor: "bg-cotizaciones-soft text-cotizaciones", accent: "bg-cotizaciones" },
  danger:  { card: "border-alerta/25",      iconWrap: "bg-alerta-soft text-alerta",        valueColor: "text-foreground", badgeColor: "bg-alerta-soft text-alerta",             accent: "bg-alerta" },
  info:    { card: "border-ventas/25",      iconWrap: "bg-ventas-soft text-ventas",        valueColor: "text-foreground", badgeColor: "bg-ventas-soft text-ventas",             accent: "bg-ventas" },
  purple:  { card: "border-clientes/25",    iconWrap: "bg-clientes-soft text-clientes",    valueColor: "text-foreground", badgeColor: "bg-clientes-soft text-clientes",         accent: "bg-clientes" },
  rose:    { card: "border-productos/25",   iconWrap: "bg-productos-soft text-productos",  valueColor: "text-foreground", badgeColor: "bg-productos-soft text-productos",       accent: "bg-productos" },
  muted:   { card: "border-border",         iconWrap: "bg-muted text-muted-foreground",    valueColor: "text-muted-foreground", badgeColor: "bg-muted text-muted-foreground",   accent: "bg-muted-foreground/40" },
};

function StatCardInner({ title, value, description, icon: Icon, variant = "default", badge, className }: StatCardProps) {
  const v = VARIANTS[variant];
  return (
    <div className={cn(
      "relative overflow-hidden bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
      v.card,
      className
    )}>
      <span className={cn("absolute inset-x-0 top-0 h-0.5", v.accent)} />
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-xs font-medium text-muted-foreground leading-tight">{title}</p>
        {Icon && (
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", v.iconWrap)}>
            <Icon size={14} />
          </div>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className={cn("font-heading text-2xl font-semibold tracking-tight leading-none", v.valueColor)}>
          {typeof value === "number" ? value.toLocaleString("es-DO") : value}
        </p>
        {badge && (
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", v.badgeColor)}>
            {badge}
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-2 leading-snug">{description}</p>
      )}
    </div>
  );
}

export function StatCard(props: StatCardProps) {
  if (props.href) {
    return (
      <Link href={props.href} className="block">
        <StatCardInner {...props} className={cn(props.className, "cursor-pointer")} />
      </Link>
    );
  }
  return <StatCardInner {...props} />;
}
