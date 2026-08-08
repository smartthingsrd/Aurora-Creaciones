"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { Plus, Loader2 } from "lucide-react";

type Usuario = { id: string; nombre: string; email: string; rol: string; activo: boolean };

const ROLES = [
  { value: "dueña", label: "Dueña" },
  { value: "admin", label: "Admin" },
  { value: "vendedora", label: "Vendedora" },
];

export function GestionUsuarios({ usuariosIniciales }: { usuariosIniciales: Usuario[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ nombre: "", email: "", password: "", rol: "vendedora" });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al crear usuario");
        return;
      }
      setForm({ nombre: "", email: "", password: "", rol: "vendedora" });
      setDialogOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function toggleActivo(u: Usuario) {
    await fetch(`/api/usuarios/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !u.activo }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus size={16} />Nuevo usuario
        </Button>
      </div>

      <div className="border border-border rounded-xl overflow-x-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuariosIniciales.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.nombre}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell className="capitalize text-muted-foreground">{u.rol}</TableCell>
                <TableCell><StatusBadge variant={u.activo ? "success" : "muted"} label={u.activo ? "Activo" : "Inactivo"} /></TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => toggleActivo(u)}>
                    {u.activo ? "Desactivar" : "Activar"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo usuario</DialogTitle></DialogHeader>
          <form onSubmit={crear} className="space-y-3">
            <div className="space-y-1.5"><Label>Nombre *</Label><Input required value={form.nombre} onChange={(e) => set("nombre", e.target.value)} autoFocus /></div>
            <div className="space-y-1.5"><Label>Email *</Label><Input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Contraseña *</Label><Input required type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Mínimo 8 caracteres" /></div>
            <div className="space-y-1.5">
              <Label>Rol *</Label>
              <Select value={form.rol} onValueChange={(v) => set("rol", v ?? "")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading} className="gap-2">{loading && <Loader2 size={14} className="animate-spin" />}Crear</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
