"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ComboboxBusqueda } from "@/components/combobox-busqueda";
import { FormError } from "@/components/form-error";

type RecursoOpcion = { id: string; nombre: string; tipo: string; unidadMedida: string };
type ProductoOpcion = { id: string; nombre: string; tipoCosteo: string };

const TIPO_LABEL: Record<string, string> = { material: "Material", mano_obra: "Mano de obra", otro: "Otro costo" };

export function AgregarComponenteReceta({
  open,
  onOpenChange,
  productoId,
  recursos,
  productos,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productoId: string;
  recursos: RecursoOpcion[];
  productos: ProductoOpcion[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"recurso" | "producto">("recurso");
  const [recursoId, setRecursoId] = useState("");
  const [productoComponenteId, setProductoComponenteId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [unidad, setUnidad] = useState("");
  const [mermaPct, setMermaPct] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const recursoSeleccionado = recursos.find((r) => r.id === recursoId);

  function reset() {
    setRecursoId(""); setProductoComponenteId(""); setCantidad(""); setUnidad(""); setMermaPct(""); setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/productos/${productoId}/receta-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recursoId: tab === "recurso" ? recursoId : null,
          productoComponenteId: tab === "producto" ? productoComponenteId : null,
          cantidad: cantidad ? Number(cantidad) : null,
          unidad: tab === "recurso" ? (unidad || recursoSeleccionado?.unidadMedida) : "unidad",
          mermaPct: mermaPct ? Number(mermaPct) / 100 : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al agregar el componente");
        return;
      }
      reset();
      onOpenChange(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar componente</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 p-1 bg-muted rounded-lg text-sm">
          <button type="button" onClick={() => setTab("recurso")} className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${tab === "recurso" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
            Recurso
          </button>
          <button type="button" onClick={() => setTab("producto")} className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${tab === "producto" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
            Otro producto (combo)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === "recurso" ? (
            <div className="space-y-1.5">
              <Label>Recurso *</Label>
              <ComboboxBusqueda
                value={recursoId}
                onChange={setRecursoId}
                placeholder="Buscar recurso..."
                opciones={recursos.map((r) => ({ value: r.id, label: `${r.nombre} (${TIPO_LABEL[r.tipo]})` }))}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Producto componente *</Label>
              <ComboboxBusqueda
                value={productoComponenteId}
                onChange={setProductoComponenteId}
                placeholder="Buscar producto..."
                opciones={productos.map((p) => ({ value: p.id, label: p.nombre }))}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cantidad *</Label>
              <Input required type="number" step="0.0001" min="0.0001" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="1" />
            </div>
            {tab === "recurso" && (
              <div className="space-y-1.5">
                <Label>Unidad</Label>
                <Input value={unidad} onChange={(e) => setUnidad(e.target.value)} placeholder={recursoSeleccionado?.unidadMedida ?? "unidad"} />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Merma (% opcional)</Label>
            <Input type="number" step="0.1" min="0" max="90" value={mermaPct} onChange={(e) => setMermaPct(e.target.value)} placeholder="0" />
          </div>

          <FormError>{error}</FormError>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
