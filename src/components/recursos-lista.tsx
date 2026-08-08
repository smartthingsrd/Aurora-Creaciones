"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Loader2, Pencil } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { ComboboxBusqueda } from "@/components/combobox-busqueda";

export type RecursoDTO = {
  id: string;
  nombre: string;
  sku: string | null;
  tipo: string;
  descripcion: string | null;
  unidadMedida: string;
  costoCompra: string;
  cantidadCompra: string;
  costoUnitario: string;
  activo: boolean;
};

const TIPOS = [
  { value: "material", label: "Material" },
  { value: "mano_obra", label: "Mano de obra" },
  { value: "otro", label: "Otro costo" },
];

const UNIDADES = ["unidad", "hoja", "metro", "cm", "ml", "litro", "gramo", "kilogramo", "minuto", "hora"];

const TIPO_LABEL: Record<string, string> = {
  material: "Material",
  mano_obra: "Mano de obra",
  otro: "Otro costo",
};

function fmt(n: string) {
  return `RD$${Number(n).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

function RecursoForm({
  open,
  onOpenChange,
  recurso,
  onGuardado,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  recurso: RecursoDTO | null;
  onGuardado: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: recurso?.nombre ?? "",
    sku: recurso?.sku ?? "",
    tipo: recurso?.tipo ?? "material",
    unidadMedida: recurso?.unidadMedida ?? "unidad",
    descripcion: recurso?.descripcion ?? "",
    costoCompra: recurso?.costoCompra ?? "",
    cantidadCompra: recurso?.cantidadCompra ?? "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const costoUnitarioPreview =
    Number(form.costoCompra) > 0 && Number(form.cantidadCompra) > 0
      ? Number(form.costoCompra) / Number(form.cantidadCompra)
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = recurso ? `/api/recursos/${recurso.id}` : "/api/recursos";
      const res = await fetch(url, {
        method: recurso ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al guardar el recurso");
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{recurso ? "Editar recurso" : "Nuevo recurso"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input required value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Papel de sublimación" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={(v) => set("tipo", v ?? "material")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Unidad de medida *</Label>
              <Select value={form.unidadMedida} onValueChange={(v) => set("unidadMedida", v ?? "unidad")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Costo de compra (RD$) *</Label>
              <Input required type="number" step="0.0001" min="0" value={form.costoCompra} onChange={(e) => set("costoCompra", e.target.value)} placeholder="500" />
            </div>
            <div className="space-y-1.5">
              <Label>Cantidad adquirida *</Label>
              <Input required type="number" step="0.0001" min="0.0001" value={form.cantidadCompra} onChange={(e) => set("cantidadCompra", e.target.value)} placeholder="100" />
            </div>
          </div>

          {costoUnitarioPreview !== null && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              Costo unitario: <span className="font-semibold text-foreground">{fmt(String(costoUnitarioPreview))}</span> por {form.unidadMedida}
            </p>
          )}

          <div className="space-y-1.5">
            <Label>SKU / código (opcional)</Label>
            <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Descripción (opcional)</Label>
            <Input value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {recurso ? "Guardar cambios" : "Crear recurso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RecursosLista({ recursosIniciales }: { recursosIniciales: RecursoDTO[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<RecursoDTO | null>(null);
  const [filtroTipo, setFiltroTipo] = useState("");

  function abrirNuevo() {
    setEditando(null);
    setDialogOpen(true);
  }

  function abrirEditar(r: RecursoDTO) {
    setEditando(r);
    setDialogOpen(true);
  }

  const visibles = filtroTipo
    ? recursosIniciales.filter((r) => r.tipo === filtroTipo)
    : recursosIniciales;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <ComboboxBusqueda
          className="w-56"
          value={filtroTipo}
          onChange={setFiltroTipo}
          vacioLabel="Todos los tipos"
          placeholder="Filtrar por tipo..."
          opciones={TIPOS}
        />
        <Button onClick={abrirNuevo} className="gap-2">
          <Plus size={16} />
          Nuevo recurso
        </Button>
      </div>

      <div className="border border-border rounded-xl overflow-x-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="text-right">Costo unitario</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Sin recursos todavía
                </TableCell>
              </TableRow>
            ) : (
              visibles.map((r) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => abrirEditar(r)}>
                  <TableCell className="font-medium">{r.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{TIPO_LABEL[r.tipo] ?? r.tipo}</TableCell>
                  <TableCell className="text-muted-foreground">{r.unidadMedida}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(r.costoUnitario)}</TableCell>
                  <TableCell>
                    <StatusBadge variant={r.activo ? "success" : "muted"} label={r.activo ? "Activo" : "Inactivo"} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); abrirEditar(r); }}>
                      <Pencil size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RecursoForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        recurso={editando}
        onGuardado={() => router.refresh()}
      />
    </div>
  );
}
