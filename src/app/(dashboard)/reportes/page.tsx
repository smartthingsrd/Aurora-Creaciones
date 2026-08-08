import { requireAdmin } from "@/lib/permisos";
import { obtenerRentabilidad, obtenerConsumoRecursos } from "@/lib/reportes";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, Percent } from "lucide-react";

function fmt(n: number) {
  return `RD$${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;
}

function fmtCantidad(n: number) {
  return n.toLocaleString("es-DO", { maximumFractionDigits: 2 });
}

function inicioDeMes(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function finDeHoy(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function aFechaInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const desde = params.desde ? new Date(`${params.desde}T00:00:00`) : inicioDeMes();
  const hasta = params.hasta ? new Date(`${params.hasta}T23:59:59.999`) : finDeHoy();

  const [rentabilidad, consumo] = await Promise.all([
    obtenerRentabilidad(desde, hasta),
    obtenerConsumoRecursos(desde, hasta),
  ]);

  const materiales = consumo.filter((c) => c.tipo === "material");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Reportes" description="Rentabilidad y consumo de materiales por período" />

      <form className="flex items-end gap-3 flex-wrap mb-6 bg-card border border-border rounded-xl p-4">
        <div className="space-y-1.5">
          <Label>Desde</Label>
          <Input type="date" name="desde" defaultValue={aFechaInput(desde)} />
        </div>
        <div className="space-y-1.5">
          <Label>Hasta</Label>
          <Input type="date" name="hasta" defaultValue={aFechaInput(hasta)} />
        </div>
        <Button type="submit">Filtrar</Button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard title="Ventas" value={fmt(rentabilidad.totales.ventas.toNumber())} icon={DollarSign} />
        <StatCard title="Costo" value={fmt(rentabilidad.totales.costo.toNumber())} variant="muted" />
        <StatCard
          title="Beneficio"
          value={fmt(rentabilidad.totales.beneficio.toNumber())}
          variant={rentabilidad.totales.beneficio.gte(0) ? "success" : "danger"}
          icon={TrendingUp}
        />
        <StatCard title="Margen" value={`${(rentabilidad.totales.margen * 100).toFixed(1)}%`} variant="purple" icon={Percent} />
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Rentabilidad por producto</h2>
      <div className="border border-border rounded-xl overflow-x-auto bg-card mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Unidades</TableHead>
              <TableHead className="text-right">Ventas</TableHead>
              <TableHead className="text-right">Costo</TableHead>
              <TableHead className="text-right">Beneficio</TableHead>
              <TableHead className="text-right">Margen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rentabilidad.productos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Sin ventas en este período
                </TableCell>
              </TableRow>
            ) : (
              rentabilidad.productos.map((p) => (
                <TableRow key={p.productoId ?? p.nombre}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell className="text-right">{p.unidadesVendidas}</TableCell>
                  <TableCell className="text-right">{fmt(p.ventas.toNumber())}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{fmt(p.costo.toNumber())}</TableCell>
                  <TableCell className={cn("text-right font-medium", p.beneficio.gte(0) ? "text-green-700" : "text-red-700")}>
                    {fmt(p.beneficio.toNumber())}
                  </TableCell>
                  <TableCell className="text-right">{(p.margen * 100).toFixed(1)}%</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-1">Consumo de materiales</h2>
      <p className="text-xs text-muted-foreground mb-3">
        Calculado con la receta actual de cada producto × unidades vendidas en el período — si una receta cambió
        desde entonces, no refleja la versión vigente al momento de la venta.
      </p>
      <div className="border border-border rounded-xl overflow-x-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead className="text-right">Cantidad consumida</TableHead>
              <TableHead className="text-right">Costo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materiales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Sin consumo en este período
                </TableCell>
              </TableRow>
            ) : (
              materiales.map((m) => (
                <TableRow key={m.recursoId}>
                  <TableCell className="font-medium">{m.nombre}</TableCell>
                  <TableCell className="text-right">
                    {fmtCantidad(m.cantidadConsumida.toNumber())} {m.unidadMedida}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{fmt(m.costoConsumido.toNumber())}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
