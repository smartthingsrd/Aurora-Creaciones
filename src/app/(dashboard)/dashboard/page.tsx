import { requireAuth, puedeVerCostos } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { FileText, Package, Users, DollarSign, AlertTriangle } from "lucide-react";

function fmt(n: number) {
  return `RD$${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;
}

export default async function DashboardPage() {
  const session = await requireAuth();
  const verCostos = puedeVerCostos(session.user.rol);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [totalProductos, totalClientes, facturasMes, recursosConMinimo, productosConMinimo] = await Promise.all([
    prisma.producto.count({ where: { activo: true } }),
    prisma.cliente.count(),
    prisma.factura.findMany({ where: { creadoEn: { gte: inicioMes } }, include: { items: true } }),
    prisma.recurso.findMany({ where: { activo: true, stock: { not: null }, stockMinimo: { not: null } }, select: { stock: true, stockMinimo: true } }),
    prisma.producto.findMany({ where: { activo: true, stock: { not: null }, stockMinimo: { not: null } }, select: { stock: true, stockMinimo: true } }),
  ]);

  const ventasMes = facturasMes.reduce((acc, f) => acc + Number(f.total), 0);
  const costoMes = facturasMes.reduce((acc, f) => acc + f.items.reduce((a, i) => a + Number(i.costoTotal ?? 0), 0), 0);
  const beneficioMes = ventasMes - costoMes;

  // Comparación campo-a-campo (stock <= stockMinimo) no la soporta el where de
  // Prisma directamente — se filtra en memoria, dataset chico (ERP de un solo negocio).
  const stockBajo =
    recursosConMinimo.filter((r) => Number(r.stock) <= Number(r.stockMinimo)).length +
    productosConMinimo.filter((p) => Number(p.stock) <= Number(p.stockMinimo)).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Dashboard" description={`Hola, ${session.user.name}`} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Ventas del mes" value={fmt(ventasMes)} icon={DollarSign} href="/facturas" />
        {verCostos && <StatCard title="Beneficio del mes" value={fmt(beneficioMes)} variant={beneficioMes >= 0 ? "success" : "danger"} />}
        <StatCard title="Productos activos" value={totalProductos} icon={Package} href="/productos" />
        <StatCard title="Clientes" value={totalClientes} icon={Users} href="/clientes" />
        <StatCard title="Facturas del mes" value={facturasMes.length} icon={FileText} href="/facturas" />
        {verCostos && stockBajo > 0 && (
          <StatCard title="Stock bajo" value={stockBajo} icon={AlertTriangle} variant="danger" href="/recursos" />
        )}
      </div>
    </div>
  );
}
