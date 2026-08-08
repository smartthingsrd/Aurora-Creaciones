"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export function ProductoNuevoForm({
  categorias,
  rol,
}: {
  categorias: { id: string; nombre: string }[];
  rol: string;
}) {
  const router = useRouter();
  const puedeCompuesto = ["dueña", "admin"].includes(rol);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    sku: "",
    categoriaId: "",
    tipoCosteo: "simple",
    costo: "",
    precio: "",
    margenObjetivo: "",
    descripcion: "",
    stock: "",
    stockMinimo: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          categoriaId: form.categoriaId || null,
          costo: form.tipoCosteo === "simple" && form.costo ? Number(form.costo) : null,
          precio: form.precio ? Number(form.precio) : null,
          margenObjetivo: form.margenObjetivo ? Number(form.margenObjetivo) / 100 : null,
          stock: form.tipoCosteo === "simple" && form.stock ? Number(form.stock) : null,
          stockMinimo: form.tipoCosteo === "simple" && form.stockMinimo ? Number(form.stockMinimo) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al crear el producto");
        return;
      }
      router.push(`/productos/${data.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-xl p-6 bg-card space-y-4 shadow-sm">
      <div className="space-y-1.5">
        <Label>Nombre *</Label>
        <Input required value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Piedra personalizada sublimada" autoFocus />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>SKU (opcional)</Label>
          <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Categoría (opcional)</Label>
          <Select value={form.categoriaId} onValueChange={(v) => set("categoriaId", v ?? "")}>
            <SelectTrigger><SelectValue placeholder="Sin categoría" /></SelectTrigger>
            <SelectContent>
              {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Tipo de costeo *</Label>
        <Select value={form.tipoCosteo} onValueChange={(v) => set("tipoCosteo", v ?? "simple")} disabled={!puedeCompuesto}>
          <SelectTrigger><SelectValue>{(v: string) => (v === "compuesto" ? "Compuesto" : "Simple")}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="simple">Simple — costo se ingresa directo</SelectItem>
            <SelectItem value="compuesto">Compuesto — costo se calcula por receta</SelectItem>
          </SelectContent>
        </Select>
        {!puedeCompuesto && (
          <p className="text-xs text-muted-foreground">Solo admin/dueña pueden crear productos compuestos.</p>
        )}
      </div>

      {form.tipoCosteo === "simple" && (
        <div className="space-y-1.5">
          <Label>Costo (RD$)</Label>
          <Input type="number" step="0.01" min="0" value={form.costo} onChange={(e) => set("costo", e.target.value)} placeholder="0.00" />
        </div>
      )}

      {form.tipoCosteo === "simple" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Stock actual (opcional)</Label>
            <Input type="number" step="0.01" min="0" value={form.stock} onChange={(e) => set("stock", e.target.value)} placeholder="Sin rastrear" />
          </div>
          <div className="space-y-1.5">
            <Label>Stock mínimo (opcional)</Label>
            <Input type="number" step="0.01" min="0" value={form.stockMinimo} onChange={(e) => set("stockMinimo", e.target.value)} placeholder="Alerta si baja de..." />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Precio de venta (RD$) *</Label>
          <Input required type="number" step="0.01" min="0" value={form.precio} onChange={(e) => set("precio", e.target.value)} placeholder="650" />
        </div>
        <div className="space-y-1.5">
          <Label>Margen objetivo (%)</Label>
          <Input type="number" step="0.1" min="0" max="99" value={form.margenObjetivo} onChange={(e) => set("margenObjetivo", e.target.value)} placeholder="40" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Descripción (opcional)</Label>
        <Input value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <Button type="submit" disabled={loading} className="gap-2">
        {loading && <Loader2 size={14} className="animate-spin" />}
        {form.tipoCosteo === "compuesto" ? "Crear y armar receta" : "Crear producto"}
      </Button>
    </form>
  );
}
