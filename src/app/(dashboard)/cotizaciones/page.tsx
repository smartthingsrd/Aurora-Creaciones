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

export default async function CotizacionesPage() {
  await requireAuth();
  const cotizaciones = await prisma.cotizacion.findMany({ orderBy: { creadoEn: "desc" }, include: { cliente: true } });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Cotizaciones"
        actions={
          <Button render={<Link href="/cotizaciones/nueva" />} className="gap-2">
            <Plus size={16} />Nueva cotización
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
            {cotizaciones.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin cotizaciones todavía</TableCell></TableRow>
            ) : (
              cotizaciones.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.numero}</TableCell>
                  <TableCell className="text-muted-foreground">{c.cliente?.nombre ?? "Sin cliente"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.creadoEn.toLocaleDateString("es-DO")}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(Number(c.total))}</TableCell>
                  <TableCell><StatusBadge variant={c.estado as BadgeVariant} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
