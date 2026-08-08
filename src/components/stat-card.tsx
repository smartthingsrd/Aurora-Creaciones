import Link from "next/link";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

export type StatCardVariant = "default" | "success" | "warning" | "danger" | "info" | "purple" | "muted";

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

const VARIANTS: Record<StatCardVariant, {
  card: string; iconWrap: string; valueColor: string; badgeColor: string;
}> = {
  default: { card: "border-border",    iconWrap: "bg-primary/8 text-primary",   valueColor: "text-foreground",     badgeColor: "bg-primary/10 text-primary" },
  success: { card: "border-green-200", iconWrap: "bg-green-50 text-green-700",  valueColor: "text-green-800",      badgeColor: "bg-green-100 text-green-700" },
  warning: { card: "border-amber-200", iconWrap: "bg-amber-50 text-amber-600", valueColor: "text-amber-800",      badgeColor: "bg-amber-100 text-amber-700" },
  danger:  { card: "border-red-200",   iconWrap: "bg-red-50 text-red-600",     valueColor: "text-red-700",        badgeColor: "bg-red-100 text-red-700" },
  info:    { card: "border-blue-200",  iconWrap: "bg-blue-50 text-blue-600",   valueColor: "text-blue-800",       badgeColor: "bg-blue-100 text-blue-700" },
  purple:  { card: "border-violet-200",iconWrap: "bg-violet-50 text-violet-600", valueColor: "text-violet-800",   badgeColor: "bg-violet-100 text-violet-700" },
  muted:   { card: "border-border",    iconWrap: "bg-muted text-muted-foreground", valueColor: "text-muted-foreground", badgeColor: "bg-muted text-muted-foreground" },
};

function StatCardInner({ title, value, description, icon: Icon, variant = "default", badge, className }: StatCardProps) {
  const v = VARIANTS[variant];
  return (
    <div className={cn(
      "bg-card border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow",
      v.card,
      className
    )}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-xs font-medium text-muted-foreground leading-tight">{title}</p>
        {Icon && (
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", v.iconWrap)}>
            <Icon size={13} />
          </div>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className={cn("text-2xl font-bold tracking-tight leading-none", v.valueColor)}>
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
