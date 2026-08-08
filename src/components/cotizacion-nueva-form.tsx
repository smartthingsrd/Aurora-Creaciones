"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComboboxBusqueda } from "@/components/combobox-busqueda";
import { Trash2, Plus, Loader2 } from "lucide-react";

type Producto = { id: string; nombre: string; precio: string };
type Cliente = { id: string; nombre: string };

type Linea = { key: string; productoId: string; descripcion: string; cantidad: string; precio: string };

function nuevaLinea(): Linea {
  return { key: Math.random().toString(36).slice(2), productoId: "", descripcion: "", cantidad: "1", precio: "" };
}

function fmt(n: number) {
  return `RD$${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;
}

export function CotizacionNuevaForm({ productos, clientes }: { productos: Producto[]; clientes: Cliente[] }) {
  const router = useRouter();
  const [clienteId, setClienteId] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([nuevaLinea()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function actualizarLinea(key: string, cambios: Partial<Linea>) {
    setLineas((ls) => ls.map((l) => (l.key === key ? { ...l, ...cambios } : l)));
  }

  function seleccionarProducto(key: string, productoId: string) {
    const p = productos.find((p) => p.id === productoId);
    actualizarLinea(key, { productoId, descripcion: p?.nombre ?? "", precio: p?.precio ?? "" });
  }

  const total = lineas.reduce((acc, l) => acc + (Number(l.cantidad) || 0) * (Number(l.precio) || 0), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const items = lineas
        .filter((l) => l.descripcion && Number(l.cantidad) > 0)
        .map((l) => ({ productoId: l.productoId || undefined, descripcion: l.descripcion, cantidad: Number(l.cantidad), precio: Number(l.precio) }));
      if (items.length === 0) {
        setError("Agrega al menos un artículo");
        return;
      }
      const res = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId: clienteId || undefined, items }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al crear la cotización");
        return;
      }
      router.push("/cotizaciones");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border border-border rounded-xl p-5 bg-card space-y-1.5 max-w-sm">
        <Label>Cliente</Label>
        <ComboboxBusqueda
          value={clienteId}
          onChange={setClienteId}
          vacioLabel="Sin cliente"
          placeholder="Buscar cliente..."
          opciones={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
        />
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Artículos</h3>
          <Button type="button" size="sm" variant="outline" onClick={() => setLineas((ls) => [...ls, nuevaLinea()])} className="gap-1.5">
            <Plus size={14} />Agregar artículo
          </Button>
        </div>
        <div className="divide-y divide-border">
          {lineas.map((l) => (
            <div key={l.key} className="p-3 grid grid-cols-12 gap-2 items-end">
              <div className="col-span-12 sm:col-span-5 space-y-1">
                <Label className="text-xs">Producto</Label>
                <ComboboxBusqueda
                  value={l.productoId}
                  onChange={(v) => seleccionarProducto(l.key, v)}
                  vacioLabel="Artículo libre"
                  placeholder="Buscar producto..."
                  opciones={productos.map((p) => ({ value: p.id, label: p.nombre }))}
                />
              </div>
              <div className="col-span-6 sm:col-span-4 space-y-1">
                <Label className="text-xs">Descripción</Label>
                <Input value={l.descripcion} onChange={(e) => actualizarLinea(l.key, { descripcion: e.target.value })} />
              </div>
              <div className="col-span-3 sm:col-span-1 space-y-1">
                <Label className="text-xs">Cant.</Label>
                <Input type="number" min="1" value={l.cantidad} onChange={(e) => actualizarLinea(l.key, { cantidad: e.target.value })} />
              </div>
              <div className="col-span-3 sm:col-span-1 space-y-1">
                <Label className="text-xs">Precio</Label>
                <Input type="number" step="0.01" value={l.precio} onChange={(e) => actualizarLinea(l.key, { precio: e.target.value })} />
              </div>
              <div className="col-span-12 sm:col-span-1 flex justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => setLineas((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : ls))}>
                  <Trash2 size={14} className="text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-border flex justify-end">
          <p className="text-lg font-bold">Total: {fmt(total)}</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <Button type="submit" disabled={loading} className="gap-2">
        {loading && <Loader2 size={14} className="animate-spin" />}
        Crear cotización
      </Button>
    </form>
  );
}
