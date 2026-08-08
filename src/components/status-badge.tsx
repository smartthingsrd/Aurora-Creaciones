import { cn } from "@/lib/utils";

export type BadgeVariant =
  // Facturas
  | "pagada" | "pendiente" | "anulada"
  // Cotizaciones
  | "borrador" | "enviada" | "aceptada" | "rechazada" | "expirada"
  // Producto
  | "simple" | "compuesto"
  // Genéricos
  | "success" | "warning" | "danger" | "info" | "purple" | "muted";

// Mismos tokens de identidad que StatCard (globals.css): beneficio=verde,
// cotizaciones=champagne, ventas=lavanda, clientes=violeta, alerta=terracota.
const BADGE_STYLES: Record<BadgeVariant, string> = {
  pagada:     "bg-beneficio-soft text-beneficio border border-beneficio/25",
  pendiente:  "bg-cotizaciones-soft text-cotizaciones border border-cotizaciones/25",
  anulada:    "bg-muted text-muted-foreground border border-border",
  borrador:   "bg-muted text-muted-foreground border border-border",
  enviada:    "bg-ventas-soft text-ventas border border-ventas/25",
  aceptada:   "bg-beneficio-soft text-beneficio border border-beneficio/25",
  rechazada:  "bg-alerta-soft text-alerta border border-alerta/25",
  expirada:   "bg-muted text-muted-foreground border border-border",
  simple:     "bg-muted text-muted-foreground border border-border",
  compuesto:  "bg-clientes-soft text-clientes border border-clientes/25",
  success:    "bg-beneficio-soft text-beneficio border border-beneficio/25",
  warning:    "bg-cotizaciones-soft text-cotizaciones border border-cotizaciones/25",
  danger:     "bg-alerta-soft text-alerta border border-alerta/25",
  info:       "bg-ventas-soft text-ventas border border-ventas/25",
  purple:     "bg-clientes-soft text-clientes border border-clientes/25",
  muted:      "bg-muted text-muted-foreground border border-border",
};

const BADGE_LABELS: Partial<Record<BadgeVariant, string>> = {
  pagada: "Pagada",
  pendiente: "Pendiente",
  anulada: "Anulada",
  borrador: "Borrador",
  enviada: "Enviada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  expirada: "Expirada",
  simple: "Simple",
  compuesto: "Compuesto",
};

export function StatusBadge({
  variant,
  label,
  className,
}: {
  variant: BadgeVariant;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        BADGE_STYLES[variant],
        className
      )}
    >
      {label ?? BADGE_LABELS[variant] ?? variant}
    </span>
  );
}
