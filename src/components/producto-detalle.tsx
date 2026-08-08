"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Plus, Trash2, Layers, Wrench, Package, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { AgregarComponenteReceta } from "@/components/agregar-componente-receta";

const TIPO_LABEL: Record<string, string> = { material: "Material", mano_obra: "Mano de obra", otro: "Otro costo" };

type Item = {
  id: string;
  cantidad: string;
  unidad: string;
  mermaPct: string;
  recurso: { id: string; nombre: string; tipo: string; costoUnitario: string } | null;
  productoComponente: { id: string; nombre: string } | null;
};

function n(s: string) { return Number(s); }
function fmt(v: number) {
  return `RD$${v.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function pct(v: number) { return `${(v * 100).toFixed(1)}%`; }

function costoItem(item: Item) {
  const cantidadEfectiva = n(item.cantidad) * (1 + n(item.mermaPct));
  if (item.recurso) return cantidadEfectiva * n(item.recurso.costoUnitario);
  return null; // costo de sub-producto no se recalcula en el cliente, se refleja al recargar
}

export function ProductoDetalle({
  rol,
  producto,
  costo,
  items,
  recursosDisponibles,
  productosDisponibles,
}: {
  rol: string;
  producto: {
    id: string; nombre: string; sku: string | null; tipoCosteo: string;
    costo: string | null; precio: string; margenObjetivo: string | null;
    stock: string | null; stockMinimo: string | null;
    activo: boolean; categoriaNombre: string | null;
  };
  costo: { materiales: string; manoObra: string; otros: string; total: string };
  items: Item[];
  recursosDisponibles: { id: string; nombre: string; tipo: string; unidadMedida: string }[];
  productosDisponibles: { id: string; nombre: string; tipoCosteo: string }[];
}) {
  const router = useRouter();
  const puedeVerCostos = ["dueña", "admin"].includes(rol);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [guardandoPrecio, setGuardandoPrecio] = useState(false);
  const [guardandoCosto, setGuardandoCosto] = useState(false);
  const [precioForm, setPrecioForm] = useState(producto.precio);
  const [margenForm, setMargenForm] = useState(
    producto.margenObjetivo ? String(Math.round(n(producto.margenObjetivo) * 1000) / 10) : ""
  );
  const [costoManualForm, setCostoManualForm] = useState(producto.costo ?? "");
  const [guardandoStock, setGuardandoStock] = useState(false);
  const [stockForm, setStockForm] = useState(producto.stock ?? "");
  const [stockMinimoForm, setStockMinimoForm] = useState(producto.stockMinimo ?? "");

  const costoTotal = n(costo.total);
  const precioActual = n(precioForm);
  const beneficio = precioActual - costoTotal;
  const margenActual = precioActual > 0 ? beneficio / precioActual : 0;

  function calcularPrecioSugerido() {
    const m = Number(margenForm) / 100;
    if (!(m > 0 && m < 1)) return;
    const sugerido = costoTotal / (1 - m);
    setPrecioForm(sugerido.toFixed(2));
  }

  async function guardarPrecio() {
    setGuardandoPrecio(true);
    try {
      await fetch(`/api/productos/${producto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          precio: Number(precioForm),
          margenObjetivo: margenForm ? Number(margenForm) / 100 : null,
        }),
      });
      router.refresh();
    } finally {
      setGuardandoPrecio(false);
    }
  }

  async function guardarCostoManual() {
    setGuardandoCosto(true);
    try {
      await fetch(`/api/productos/${producto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ costo: costoManualForm ? Number(costoManualForm) : null }),
      });
      router.refresh();
    } finally {
      setGuardandoCosto(false);
    }
  }

  async function guardarStock() {
    setGuardandoStock(true);
    try {
      await fetch(`/api/productos/${producto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock: stockForm ? Number(stockForm) : null,
          stockMinimo: stockMinimoForm ? Number(stockMinimoForm) : null,
        }),
      });
      router.refresh();
    } finally {
      setGuardandoStock(false);
    }
  }

  async function eliminarItem(itemId: string) {
    if (!confirm("¿Quitar este componente de la receta?")) return;
    await fetch(`/api/productos/${producto.id}/receta-items/${itemId}`, { method: "DELETE" });
    router.refresh();
  }

  const itemsOrdenados = useMemo(() => items, [items]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge variant={producto.tipoCosteo === "compuesto" ? "compuesto" : "simple"} />
        {producto.sku && <span className="text-xs text-muted-foreground">SKU: {producto.sku}</span>}
        {producto.categoriaNombre && <span className="text-xs text-muted-foreground">· {producto.categoriaNombre}</span>}
        <StatusBadge variant={producto.activo ? "success" : "muted"} label={producto.activo ? "Activo" : "Inactivo"} />
        {producto.stock != null && producto.stockMinimo != null && n(producto.stock) <= n(producto.stockMinimo) && (
          <StatusBadge variant="danger" label={`Stock bajo: ${producto.stock}`} />
        )}
      </div>

      {producto.tipoCosteo === "simple" && puedeVerCostos && (
        <div className="border border-border rounded-xl p-5 bg-card space-y-3">
          <h3 className="text-sm font-semibold">Costo</h3>
          <div className="flex items-end gap-3">
            <div className="space-y-1.5 flex-1 max-w-[200px]">
              <Label>Costo (RD$)</Label>
              <Input type="number" step="0.01" value={costoManualForm} onChange={(e) => setCostoManualForm(e.target.value)} />
            </div>
            <Button onClick={guardarCostoManual} disabled={guardandoCosto} className="gap-2">
              {guardandoCosto && <Loader2 size={14} className="animate-spin" />}
              Guardar
            </Button>
          </div>
        </div>
      )}

      {producto.tipoCosteo === "simple" && puedeVerCostos && (
        <div className="border border-border rounded-xl p-5 bg-card space-y-3">
          <h3 className="text-sm font-semibold">Stock</h3>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1.5">
              <Label>Stock actual</Label>
              <Input type="number" step="0.01" min="0" className="w-32" value={stockForm} onChange={(e) => setStockForm(e.target.value)} placeholder="Sin rastrear" />
            </div>
            <div className="space-y-1.5">
              <Label>Stock mínimo</Label>
              <Input type="number" step="0.01" min="0" className="w-32" value={stockMinimoForm} onChange={(e) => setStockMinimoForm(e.target.value)} placeholder="Alerta si baja de..." />
            </div>
            <Button onClick={guardarStock} disabled={guardandoStock} className="gap-2">
              {guardandoStock && <Loader2 size={14} className="animate-spin" />}
              Guardar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Se descuenta solo al facturar este producto. Dejar en blanco si no quieres rastrear stock.
          </p>
        </div>
      )}

      {producto.tipoCosteo === "compuesto" && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Producción / Receta</h2>

          {puedeVerCostos && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard title="Materiales" value={fmt(n(costo.materiales))} icon={Package} variant="default" />
              <StatCard title="Mano de obra" value={fmt(n(costo.manoObra))} icon={Wrench} variant="info" />
              <StatCard title="Otros costos" value={fmt(n(costo.otros))} icon={Layers} variant="muted" />
              <StatCard title="Costo total" value={fmt(costoTotal)} icon={DollarSign} variant="purple" />
            </div>
          )}

          <div className="border border-border rounded-xl bg-card overflow-x-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Componentes</h3>
              <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
                <Plus size={14} />
                Agregar componente
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recurso / Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Unidad</TableHead>
                  {puedeVerCostos && <TableHead className="text-right">Costo unit.</TableHead>}
                  {puedeVerCostos && <TableHead className="text-right">Costo</TableHead>}
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsOrdenados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Sin componentes todavía — agrega el primero
                    </TableCell>
                  </TableRow>
                ) : (
                  itemsOrdenados.map((item) => {
                    const costoLinea = costoItem(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.recurso?.nombre ?? item.productoComponente?.nombre}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.recurso ? TIPO_LABEL[item.recurso.tipo] : "Producto (combo)"}
                        </TableCell>
                        <TableCell className="text-right">{item.cantidad}</TableCell>
                        <TableCell className="text-muted-foreground">{item.unidad}</TableCell>
                        {puedeVerCostos && (
                          <TableCell className="text-right text-muted-foreground">
                            {item.recurso ? fmt(n(item.recurso.costoUnitario)) : "—"}
                          </TableCell>
                        )}
                        {puedeVerCostos && (
                          <TableCell className="text-right font-medium">
                            {costoLinea != null ? fmt(costoLinea) : "ver receta anidada"}
                          </TableCell>
                        )}
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => eliminarItem(item.id)}>
                            <Trash2 size={14} className="text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <AgregarComponenteReceta
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            productoId={producto.id}
            recursos={recursosDisponibles}
            productos={productosDisponibles}
          />
        </div>
      )}

      {puedeVerCostos && (
        <div className="border border-border rounded-xl p-5 bg-card space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp size={15} />Precio y rentabilidad</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard title="Costo" value={fmt(costoTotal)} variant="muted" />
            <StatCard title="Precio" value={fmt(precioActual)} variant="default" />
            <StatCard title="Beneficio" value={fmt(beneficio)} variant={beneficio >= 0 ? "success" : "danger"} />
            <StatCard title="Margen" value={pct(margenActual)} variant="purple" />
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Margen objetivo (%)</Label>
              <Input type="number" step="0.1" min="0" max="99" className="w-32" value={margenForm} onChange={(e) => setMargenForm(e.target.value)} />
            </div>
            <Button type="button" variant="outline" onClick={calcularPrecioSugerido}>
              Calcular precio sugerido
            </Button>
            <div className="space-y-1.5">
              <Label>Precio de venta (RD$)</Label>
              <Input type="number" step="0.01" className="w-36" value={precioForm} onChange={(e) => setPrecioForm(e.target.value)} />
            </div>
            <Button onClick={guardarPrecio} disabled={guardandoPrecio} className="gap-2">
              {guardandoPrecio && <Loader2 size={14} className="animate-spin" />}
              Guardar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Margen = beneficio ÷ precio (no markup). Fórmula: precio = costo ÷ (1 − margen).
          </p>
        </div>
      )}

      {!puedeVerCostos && (
        <div className="border border-border rounded-xl p-5 bg-card">
          <p className="text-sm text-muted-foreground">Precio de venta</p>
          <p className="text-2xl font-bold">{fmt(precioActual)}</p>
        </div>
      )}
    </div>
  );
}
