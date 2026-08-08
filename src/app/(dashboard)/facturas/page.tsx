import Link from "next/link";
import { requireAuth } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, type BadgeVariant } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

function fmt(n: number) {
  return `RD$${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;
}

export default async function FacturasPage() {
  await requireAuth();
  const facturas = await prisma.factura.findMany({
    orderBy: { creadoEn: "desc" },
    include: { cliente: true },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Facturas"
        actions={
          <Button render={<Link href="/facturas/nueva" />} className="gap-2">
            <Plus size={16} />Nueva factura
          </Button>
        }
      />
      <div className="border border-border rounded-xl overflow-x-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facturas.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin facturas todavía</TableCell></TableRow>
            ) : (
              facturas.map((f) => (
                <TableRow key={f.id} className="cursor-pointer hover:bg-muted/40">
                  <TableCell>
                    <Link href={`/facturas/${f.id}`} className="font-medium hover:underline">{f.numero}</Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{f.cliente?.nombre ?? "Sin cliente"}</TableCell>
                  <TableCell className="text-muted-foreground">{f.creadoEn.toLocaleDateString("es-DO")}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(Number(f.total))}</TableCell>
                  <TableCell><StatusBadge variant={f.estado as BadgeVariant} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
