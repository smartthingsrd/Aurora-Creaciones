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

const BADGE_STYLES: Record<BadgeVariant, string> = {
  pagada:     "bg-green-50 text-green-700 border border-green-200",
  pendiente:  "bg-amber-50 text-amber-700 border border-amber-200",
  anulada:    "bg-gray-100 text-gray-500 border border-gray-200",
  borrador:   "bg-slate-50 text-slate-700 border border-slate-200",
  enviada:    "bg-blue-50 text-blue-700 border border-blue-200",
  aceptada:   "bg-green-50 text-green-700 border border-green-200",
  rechazada:  "bg-red-50 text-red-700 border border-red-200",
  expirada:   "bg-gray-100 text-gray-500 border border-gray-200",
  simple:     "bg-slate-50 text-slate-700 border border-slate-200",
  compuesto:  "bg-violet-50 text-violet-700 border border-violet-200",
  success:    "bg-green-50 text-green-700 border border-green-200",
  warning:    "bg-amber-50 text-amber-700 border border-amber-200",
  danger:     "bg-red-50 text-red-700 border border-red-200",
  info:       "bg-blue-50 text-blue-700 border border-blue-200",
  purple:     "bg-violet-50 text-violet-700 border border-violet-200",
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
