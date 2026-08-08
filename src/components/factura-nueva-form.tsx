"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComboboxBusqueda } from "@/components/combobox-busqueda";
import { FormError } from "@/components/form-error";
import { Trash2, Plus, Loader2 } from "lucide-react";

type ExtraOpcion = { id: string; nombre: string; tipo: string; montoPrecio: string; montoCosto: string };
type Producto = { id: string; nombre: string; precio: string; extras: ExtraOpcion[] };
type Cliente = { id: string; nombre: string };

type Linea = {
  key: string;
  productoId: string;
  descripcion: string;
  cantidad: string;
  precio: string;
  extraIds: string[];
};

function nuevaLinea(): Linea {
  return { key: Math.random().toString(36).slice(2), productoId: "", descripcion: "", cantidad: "1", precio: "", extraIds: [] };
}

function fmt(n: number) {
  return `RD$${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;
}

export function FacturaNuevaForm({ productos, clientes }: { productos: Producto[]; clientes: Cliente[] }) {
  const router = useRouter();
  const [clienteId, setClienteId] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [lineas, setLineas] = useState<Linea[]>([nuevaLinea()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function actualizarLinea(key: string, cambios: Partial<Linea>) {
    setLineas((ls) => ls.map((l) => (l.key === key ? { ...l, ...cambios } : l)));
  }

  function seleccionarProducto(key: string, productoId: string) {
    const p = productos.find((p) => p.id === productoId);
    actualizarLinea(key, { productoId, descripcion: p?.nombre ?? "", precio: p?.precio ?? "", extraIds: [] });
  }

  function alternarExtra(key: string, extraId: string) {
    setLineas((ls) =>
      ls.map((l) =>
        l.key === key
          ? { ...l, extraIds: l.extraIds.includes(extraId) ? l.extraIds.filter((id) => id !== extraId) : [...l.extraIds, extraId] }
          : l
      )
    );
  }

  function agregarLinea() {
    setLineas((ls) => [...ls, nuevaLinea()]);
  }

  function quitarLinea(key: string) {
    setLineas((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls));
  }

  function extrasDeLinea(l: Linea): ExtraOpcion[] {
    return productos.find((p) => p.id === l.productoId)?.extras ?? [];
  }

  function precioEfectivoLinea(l: Linea): number {
    const extrasPrecio = extrasDeLinea(l)
      .filter((ex) => l.extraIds.includes(ex.id) && ex.tipo !== "costo")
      .reduce((acc, ex) => acc + Number(ex.montoPrecio), 0);
    return (Number(l.precio) || 0) + extrasPrecio;
  }

  const total = lineas.reduce((acc, l) => acc + (Number(l.cantidad) || 0) * precioEfectivoLinea(l), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const items = lineas
        .filter((l) => l.descripcion && Number(l.cantidad) > 0)
        .map((l) => ({
          productoId: l.productoId || undefined,
          descripcion: l.descripcion,
          cantidad: Number(l.cantidad),
          precio: Number(l.precio),
          extraIds: l.extraIds,
        }));
      if (items.length === 0) {
        setError("Agrega al menos un artículo");
        return;
      }
      const res = await fetch("/api/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId: clienteId || undefined, metodoPago, items }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al crear la factura");
        return;
      }
      router.push(`/facturas/${data.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border border-border rounded-xl p-5 bg-card grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Cliente</Label>
          <ComboboxBusqueda
            value={clienteId}
            onChange={setClienteId}
            vacioLabel="Sin cliente"
            placeholder="Buscar cliente..."
            opciones={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Método de pago</Label>
          <ComboboxBusqueda
            value={metodoPago}
            onChange={setMetodoPago}
            opciones={[
              { value: "efectivo", label: "Efectivo" },
              { value: "tarjeta", label: "Tarjeta" },
              { value: "transferencia", label: "Transferencia" },
            ]}
          />
        </div>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Artículos</h3>
          <Button type="button" size="sm" variant="outline" onClick={agregarLinea} className="gap-1.5">
            <Plus size={14} />Agregar artículo
          </Button>
        </div>
        <div className="divide-y divide-border">
          {lineas.map((l) => {
            const extrasDisponibles = extrasDeLinea(l);
            return (
            <div key={l.key} className="p-3 space-y-2">
              <div className="grid grid-cols-12 gap-2 items-end">
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
                  <Button type="button" variant="ghost" size="sm" onClick={() => quitarLinea(l.key)}>
                    <Trash2 size={14} className="text-alerta" />
                  </Button>
                </div>
              </div>

              {extrasDisponibles.length > 0 && (
                <div className="flex flex-wrap gap-2 pl-1">
                  {extrasDisponibles.map((ex) => {
                    const marcado = l.extraIds.includes(ex.id);
                    return (
                      <label
                        key={ex.id}
                        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border cursor-pointer transition-colors ${
                          marcado ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        <input type="checkbox" className="hidden" checked={marcado} onChange={() => alternarExtra(l.key, ex.id)} />
                        {ex.nombre}
                        {ex.tipo !== "costo" && Number(ex.montoPrecio) > 0 && ` (+${fmt(Number(ex.montoPrecio))})`}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            );
          })}
        </div>
        <div className="px-4 py-3 border-t border-border flex justify-end">
          <p className="text-lg font-bold">Total: {fmt(total)}</p>
        </div>
      </div>

      <FormError>{error}</FormError>

      <Button type="submit" disabled={loading} className="gap-2">
        {loading && <Loader2 size={14} className="animate-spin" />}
        Crear factura
      </Button>
    </form>
  );
}
