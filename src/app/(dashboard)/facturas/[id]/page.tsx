import { notFound } from "next/navigation";
import { requireAuth, puedeVerCostos } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, type BadgeVariant } from "@/components/status-badge";
import { StatCard } from "@/components/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp } from "lucide-react";

function fmt(n: number) {
  return `RD$${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;
}

export default async function FacturaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAuth();
  const verCostos = puedeVerCostos(session.user.rol);

  const factura = await prisma.factura.findUnique({
    where: { id },
    include: { cliente: true, usuario: true, items: true },
  });
  if (!factura) notFound();

  const costoTotal = factura.items.reduce((acc, i) => acc + Number(i.costoTotal ?? 0), 0);
  const beneficio = Number(factura.total) - costoTotal;
  const margen = Number(factura.total) > 0 ? beneficio / Number(factura.total) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <PageHeader
        title={factura.numero}
        description={factura.cliente?.nombre ?? "Sin cliente"}
        actions={<StatusBadge variant={factura.estado as BadgeVariant} />}
      />

      {verCostos && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard title="Total vendido" value={fmt(Number(factura.total))} icon={DollarSign} />
          <StatCard title="Costo (snapshot)" value={fmt(costoTotal)} variant="muted" />
          <StatCard title="Beneficio" value={fmt(beneficio)} variant={beneficio >= 0 ? "success" : "danger"} icon={TrendingUp} />
          <StatCard title="Margen" value={`${(margen * 100).toFixed(1)}%`} variant="purple" />
        </div>
      )}

      <div className="border border-border rounded-xl bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Cant.</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              {verCostos && <TableHead className="text-right">Costo (snapshot)</TableHead>}
              {verCostos && <TableHead className="text-right">Margen</TableHead>}
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {factura.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.descripcion}</TableCell>
                <TableCell className="text-right">{item.cantidad}</TableCell>
                <TableCell className="text-right">{fmt(Number(item.precio))}</TableCell>
                {verCostos && (
                  <TableCell className="text-right text-muted-foreground">
                    {item.costoTotal != null ? fmt(Number(item.costoTotal)) : "—"}
                  </TableCell>
                )}
                {verCostos && (
                  <TableCell className="text-right text-muted-foreground">
                    {item.margenObtenido != null ? `${(Number(item.margenObtenido) * 100).toFixed(1)}%` : "—"}
                  </TableCell>
                )}
                <TableCell className="text-right font-medium">{fmt(Number(item.total))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="px-4 py-3 border-t border-border flex justify-end">
          <p className="text-lg font-bold">Total: {fmt(Number(factura.total))}</p>
        </div>
      </div>
    </div>
  );
}
