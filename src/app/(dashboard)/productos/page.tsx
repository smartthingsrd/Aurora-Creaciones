import Link from "next/link";
import { requireAuth, puedeVerCostos } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

function fmt(n: number) {
  return `RD$${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;
}

export default async function ProductosPage() {
  const session = await requireAuth();
  const verCostos = puedeVerCostos(session.user.rol);

  const productos = await prisma.producto.findMany({
    orderBy: { nombre: "asc" },
    include: { categoria: true },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Productos"
        description="Catálogo de productos simples y compuestos"
        actions={
          <Button render={<Link href="/productos/nuevo" />} className="gap-2">
            <Plus size={16} />Nuevo producto
          </Button>
        }
      />

      <div className="border border-border rounded-xl overflow-x-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Costeo</TableHead>
              {verCostos && <TableHead className="text-right">Costo</TableHead>}
              <TableHead className="text-right">Precio</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={verCostos ? 6 : 5} className="text-center text-muted-foreground py-8">
                  Sin productos todavía
                </TableCell>
              </TableRow>
            ) : (
              productos.map((p) => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/40">
                  <TableCell>
                    <Link href={`/productos/${p.id}`} className="font-medium hover:underline">
                      {p.nombre}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.categoria?.nombre ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge variant={p.tipoCosteo === "compuesto" ? "compuesto" : "simple"} />
                  </TableCell>
                  {verCostos && (
                    <TableCell className="text-right text-muted-foreground">
                      {p.tipoCosteo === "simple" && p.costo != null ? fmt(Number(p.costo)) : "Ver receta"}
                    </TableCell>
                  )}
                  <TableCell className="text-right font-medium">{fmt(Number(p.precio))}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusBadge variant={p.activo ? "success" : "muted"} label={p.activo ? "Activo" : "Inactivo"} />
                      {p.stock != null && p.stockMinimo != null && Number(p.stock) <= Number(p.stockMinimo) && (
                        <StatusBadge variant="danger" label="Stock bajo" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
