"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";

type Dia = { fecha: string; total: number };

function fmt(n: number) {
  return `RD$${n.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`;
}

function etiquetaDia(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-DO", { weekday: "short" }).replace(".", "");
}

export function VentasChart({ dias }: { dias: Dia[] }) {
  const [rango, setRango] = useState<7 | 30>(7);

  if (dias.every((d) => d.total === 0)) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Todavía no hay ventas este mes ✨"
        description="Cuando Aurora empiece a facturar, verás aquí su evolución."
      />
    );
  }

  const visibles = rango === 7 ? dias.slice(-7) : dias;
  const max = Math.max(...visibles.map((d) => d.total), 1);
  const total = visibles.reduce((acc, d) => acc + d.total, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-xs text-muted-foreground">
          Total del período: <span className="font-semibold text-foreground">{fmt(total)}</span>
        </p>
        <div className="flex gap-0.5 bg-muted rounded-lg p-0.5 text-xs">
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRango(r)}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors",
                rango === r ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r} días
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-1 h-28">
        {visibles.map((d) => (
          <div key={d.fecha} className="flex-1 h-full flex items-end" title={`${d.fecha}: ${fmt(d.total)}`}>
            <div
              className="w-full rounded-t-md bg-ventas-soft hover:bg-ventas transition-colors min-h-[3px]"
              style={{ height: `${Math.max((d.total / max) * 100, d.total > 0 ? 6 : 2)}%` }}
            />
          </div>
        ))}
      </div>

      {rango === 7 && (
        <div className="flex gap-1 mt-1.5">
          {visibles.map((d) => (
            <div key={d.fecha} className="flex-1 text-center text-[10px] text-muted-foreground capitalize">
              {etiquetaDia(d.fecha)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
