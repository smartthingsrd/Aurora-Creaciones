"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2, Pencil } from "lucide-react";

export type ClienteDTO = {
  id: string;
  nombre: string;
  cedula: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
};

function ClienteForm({
  open, onOpenChange, cliente, onGuardado,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; cliente: ClienteDTO | null; onGuardado: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: cliente?.nombre ?? "",
    cedula: cliente?.cedula ?? "",
    telefono: cliente?.telefono ?? "",
    email: cliente?.email ?? "",
    direccion: cliente?.direccion ?? "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = cliente ? `/api/clientes/${cliente.id}` : "/api/clientes";
      const res = await fetch(url, {
        method: cliente ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{cliente ? "Editar cliente" : "Nuevo cliente"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input required value={form.nombre} onChange={(e) => set("nombre", e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Cédula</Label><Input value={form.cedula} onChange={(e) => set("cedula", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.telefono} onChange={(e) => set("telefono", e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Dirección</Label><Input value={form.direccion} onChange={(e) => set("direccion", e.target.value)} /></div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="gap-2">{loading && <Loader2 size={14} className="animate-spin" />}Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ClientesLista({ clientesIniciales }: { clientesIniciales: ClienteDTO[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<ClienteDTO | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditando(null); setDialogOpen(true); }} className="gap-2">
          <Plus size={16} />Nuevo cliente
        </Button>
      </div>
      <div className="border border-border rounded-xl overflow-x-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientesIniciales.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin clientes todavía</TableCell></TableRow>
            ) : (
              clientesIniciales.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => { setEditando(c); setDialogOpen(true); }}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{c.cedula ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.telefono ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditando(c); setDialogOpen(true); }}>
                      <Pencil size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <ClienteForm open={dialogOpen} onOpenChange={setDialogOpen} cliente={editando} onGuardado={() => router.refresh()} />
    </div>
  );
}
