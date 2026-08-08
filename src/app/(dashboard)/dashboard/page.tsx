import { requireAuth, puedeVerCostos } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { FileText, Package, Users, DollarSign } from "lucide-react";

function fmt(n: number) {
  return `RD$${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;
}

export default async function DashboardPage() {
  const session = await requireAuth();
  const verCostos = puedeVerCostos(session.user.rol);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [totalProductos, totalClientes, facturasMes] = await Promise.all([
    prisma.producto.count({ where: { activo: true } }),
    prisma.cliente.count(),
    prisma.factura.findMany({ where: { creadoEn: { gte: inicioMes } }, include: { items: true } }),
  ]);

  const ventasMes = facturasMes.reduce((acc, f) => acc + Number(f.total), 0);
  const costoMes = facturasMes.reduce((acc, f) => acc + f.items.reduce((a, i) => a + Number(i.costoTotal ?? 0), 0), 0);
  const beneficioMes = ventasMes - costoMes;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Dashboard" description={`Hola, ${session.user.name}`} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Ventas del mes" value={fmt(ventasMes)} icon={DollarSign} href="/facturas" />
        {verCostos && <StatCard title="Beneficio del mes" value={fmt(beneficioMes)} variant={beneficioMes >= 0 ? "success" : "danger"} />}
        <StatCard title="Productos activos" value={totalProductos} icon={Package} href="/productos" />
        <StatCard title="Clientes" value={totalClientes} icon={Users} href="/clientes" />
        <StatCard title="Facturas del mes" value={facturasMes.length} icon={FileText} href="/facturas" />
      </div>
    </div>
  );
}
