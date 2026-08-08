"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type OpcionCombobox = { value: string; label: string };

export function ComboboxBusqueda({
  opciones,
  value,
  onChange,
  vacioLabel,
  placeholder = "Buscar...",
  className,
}: {
  opciones: OpcionCombobox[];
  value: string;
  onChange: (value: string) => void;
  /** Si se pasa, aparece como primera opción seleccionable con value="" */
  vacioLabel?: string;
  placeholder?: string;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const contenedorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
        setBusqueda("");
      }
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  useEffect(() => {
    if (abierto) inputRef.current?.focus();
  }, [abierto]);

  const seleccionada = opciones.find(o => o.value === value);
  const etiqueta = seleccionada?.label ?? (value === "" ? (vacioLabel ?? "") : "");

  const filtradas = busqueda.trim()
    ? opciones.filter(o => o.label.toLowerCase().includes(busqueda.toLowerCase()))
    : opciones;

  function seleccionar(v: string) {
    onChange(v);
    setAbierto(false);
    setBusqueda("");
  }

  return (
    <div ref={contenedorRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setAbierto(v => !v)}
        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-left flex items-center justify-between gap-2"
      >
        <span className={cn("truncate", !etiqueta && "text-muted-foreground")}>
          {etiqueta || placeholder}
        </span>
        <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
      </button>

      {abierto && (
        <div className="absolute z-30 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
          <div className="p-1.5 border-b border-border relative">
            <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={e => { if (e.key === "Escape") { setAbierto(false); setBusqueda(""); } }}
              placeholder={placeholder}
              className="w-full h-8 rounded border border-input bg-background pl-7 pr-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {vacioLabel && (
              <button
                type="button"
                onClick={() => seleccionar("")}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-sm hover:bg-muted/60 transition-colors",
                  value === "" && "bg-primary/10 font-medium"
                )}
              >
                {vacioLabel}
              </button>
            )}
            {filtradas.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</p>
            ) : (
              filtradas.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => seleccionar(o.value)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-sm hover:bg-muted/60 transition-colors truncate",
                    o.value === value && "bg-primary/10 font-medium"
                  )}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
