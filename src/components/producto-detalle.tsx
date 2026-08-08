"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, Layers, Wrench, Package, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { AgregarComponenteReceta } from "@/components/agregar-componente-receta";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const TIPO_LABEL: Record<string, string> = { material: "Material", mano_obra: "Mano de obra", otro: "Otro costo" };

type Item = {
  id: string;
  cantidad: string;
  unidad: string;
  mermaPct: string;
  recurso: { id: string; nombre: string; tipo: string; costoUnitario: string } | null;
  productoComponente: { id: string; nombre: string } | null;
};

export type Extra = {
  id: string;
  nombre: string;
  tipo: string; // precio | costo | ambos
  montoPrecio: string;
  montoCosto: string;
  activo: boolean;
};

const EXTRA_TIPO_LABEL: Record<string, string> = { precio: "Precio", costo: "Costo", ambos: "Precio y costo" };

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

// Cantidad/unidad/merma de un componente ya agregado — el recurso/producto
// referenciado no se puede cambiar aquí (para eso se borra y se agrega de nuevo).
function EditarItemDialog({
  open,
  onOpenChange,
  productoId,
  item,
  onGuardado,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productoId: string;
  item: Item | null;
  onGuardado: () => void;
}) {
  const [cantidad, setCantidad] = useState(item?.cantidad ?? "");
  const [unidad, setUnidad] = useState(item?.unidad ?? "");
  const [mermaPct, setMermaPct] = useState(item ? String(n(item.mermaPct) * 100) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/productos/${productoId}/receta-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cantidad: Number(cantidad),
          unidad,
          mermaPct: mermaPct ? Number(mermaPct) / 100 : 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al guardar");
        return;
      }
      onGuardado();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar componente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-sm font-medium">{item?.recurso?.nombre ?? item?.productoComponente?.nombre}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cantidad *</Label>
              <Input required type="number" step="0.0001" min="0.0001" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Unidad</Label>
              <Input value={unidad} onChange={(e) => setUnidad(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Merma (% opcional)</Label>
            <Input type="number" step="0.1" min="0" max="90" value={mermaPct} onChange={(e) => setMermaPct(e.target.value)} placeholder="0" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExtraForm({
  open,
  onOpenChange,
  productoId,
  onGuardado,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productoId: string;
  onGuardado: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("precio");
  const [montoPrecio, setMontoPrecio] = useState("");
  const [montoCosto, setMontoCosto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/productos/${productoId}/extras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          tipo,
          montoPrecio: montoPrecio ? Number(montoPrecio) : 0,
          montoCosto: montoCosto ? Number(montoCosto) : 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al crear el extra");
        return;
      }
      onGuardado();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo extra opcional</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Grabado láser" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Afecta *</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v ?? "precio")}>
              <SelectTrigger><SelectValue>{(v: string) => EXTRA_TIPO_LABEL[v] ?? v}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="precio">Solo precio (lo que paga el cliente)</SelectItem>
                <SelectItem value="costo">Solo costo (no se cobra aparte)</SelectItem>
                <SelectItem value="ambos">Precio y costo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {tipo !== "costo" && (
              <div className="space-y-1.5">
                <Label>+ Precio (RD$)</Label>
                <Input type="number" step="0.01" min="0" value={montoPrecio} onChange={(e) => setMontoPrecio(e.target.value)} placeholder="0.00" />
              </div>
            )}
            {tipo !== "precio" && (
              <div className="space-y-1.5">
                <Label>+ Costo (RD$)</Label>
                <Input type="number" step="0.01" min="0" value={montoCosto} onChange={(e) => setMontoCosto(e.target.value)} placeholder="0.00" />
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Crear extra
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExtrasProducto({ productoId, extras }: { productoId: string; extras: Extra[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  async function toggleActivo(extra: Extra) {
    await fetch(`/api/productos/${productoId}/extras/${extra.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !extra.activo }),
    });
    router.refresh();
  }

  async function eliminarExtra(extraId: string) {
    if (!confirm("¿Eliminar este extra?")) return;
    await fetch(`/api/productos/${productoId}/extras/${extraId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="border border-border rounded-xl bg-card overflow-x-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold">Extras opcionales</h3>
          <p className="text-xs text-muted-foreground">Se seleccionan al facturar este producto</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
          <Plus size={14} />
          Agregar extra
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Afecta</TableHead>
            <TableHead className="text-right">+ Precio</TableHead>
            <TableHead className="text-right">+ Costo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {extras.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                Sin extras — ej. grabado láser, empaque de regalo, cargo por urgencia
              </TableCell>
            </TableRow>
          ) : (
            extras.map((ex) => (
              <TableRow key={ex.id}>
                <TableCell className="font-medium">{ex.nombre}</TableCell>
                <TableCell className="text-muted-foreground">{EXTRA_TIPO_LABEL[ex.tipo] ?? ex.tipo}</TableCell>
                <TableCell className="text-right">{ex.tipo !== "costo" ? fmt(n(ex.montoPrecio)) : "—"}</TableCell>
                <TableCell className="text-right text-muted-foreground">{ex.tipo !== "precio" ? fmt(n(ex.montoCosto)) : "—"}</TableCell>
                <TableCell>
                  <button onClick={() => toggleActivo(ex)}>
                    <StatusBadge variant={ex.activo ? "success" : "muted"} label={ex.activo ? "Activo" : "Inactivo"} />
                  </button>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => eliminarExtra(ex.id)}>
                    <Trash2 size={14} className="text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <ExtraForm open={dialogOpen} onOpenChange={setDialogOpen} productoId={productoId} onGuardado={() => router.refresh()} />
    </div>
  );
}

export function ProductoDetalle({
  rol,
  producto,
  costo,
  items,
  extras,
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
  extras: Extra[];
  recursosDisponibles: { id: string; nombre: string; tipo: string; unidadMedida: string }[];
  productosDisponibles: { id: string; nombre: string; tipoCosteo: string }[];
}) {
  const router = useRouter();
  const puedeVerCostos = ["dueña", "admin"].includes(rol);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoItem, setEditandoItem] = useState<Item | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  // Fuerza remount del diálogo de edición al abrirlo — mismo motivo que el
  // fix de RecursoForm/ClienteForm: sin esto, reabrir para otro item arrastra
  // los valores del item editado anteriormente.
  const [editFormInstance, setEditFormInstance] = useState(0);
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

  function abrirEditarItem(item: Item) {
    setEditandoItem(item);
    setEditFormInstance((n) => n + 1);
    setEditDialogOpen(true);
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
                  <TableHead className="text-right">Merma</TableHead>
                  {puedeVerCostos && <TableHead className="text-right">Costo unit.</TableHead>}
                  {puedeVerCostos && <TableHead className="text-right">Costo</TableHead>}
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsOrdenados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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
                        <TableCell className="text-right text-muted-foreground">
                          {n(item.mermaPct) > 0 ? pct(n(item.mermaPct)) : "—"}
                        </TableCell>
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
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => abrirEditarItem(item)}>
                              <Pencil size={14} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => eliminarItem(item.id)}>
                              <Trash2 size={14} className="text-red-500" />
                            </Button>
                          </div>
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

          <EditarItemDialog
            key={editFormInstance}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            productoId={producto.id}
            item={editandoItem}
            onGuardado={() => router.refresh()}
          />
        </div>
      )}

      {puedeVerCostos && <ExtrasProducto productoId={producto.id} extras={extras} />}

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
