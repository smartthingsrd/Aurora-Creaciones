import Link from "next/link";
import { requireAuth, puedeVerCostos } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { obtenerRentabilidad } from "@/lib/reportes";
import { StatCard } from "@/components/stat-card";
import { StatusBadge, type BadgeVariant } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { VentasChart } from "@/components/ventas-chart";
import {
  FileText, Package, Users, DollarSign, AlertTriangle, ClipboardList,
  TrendingUp, TrendingDown, Sparkles, Receipt, UserPlus,
} from "lucide-react";

function fmt(n: number) {
  return `RD$${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;
}

function primerNombre(nombreCompleto: string) {
  return nombreCompleto.split(" ")[0];
}

export default async function DashboardPage() {
  const session = await requireAuth();
  const verCostos = puedeVerCostos(session.user.rol);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const inicioMesAnterior = new Date(inicioMes);
  inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1);

  const hace30 = new Date();
  hace30.setDate(hace30.getDate() - 29);
  hace30.setHours(0, 0, 0, 0);

  const hoy = new Date();

  const [
    totalProductos, totalClientes, facturasMes, facturasMesAnterior,
    pedidosPendientes, cotizacionesVigentes,
    recursosConMinimo, productosConMinimo,
    facturas30d,
    ultimasFacturas, ultimasCotizaciones, ultimosClientes,
    rentabilidad,
  ] = await Promise.all([
    prisma.producto.count({ where: { activo: true } }),
    prisma.cliente.count(),
    prisma.factura.findMany({ where: { estado: { not: "anulada" }, creadoEn: { gte: inicioMes } }, include: { items: true } }),
    prisma.factura.findMany({ where: { estado: { not: "anulada" }, creadoEn: { gte: inicioMesAnterior, lt: inicioMes } }, select: { total: true } }),
    prisma.factura.count({ where: { estado: "pendiente" } }),
    prisma.cotizacion.count({ where: { estado: { in: ["borrador", "enviada", "aceptada"] } } }),
    prisma.recurso.findMany({ where: { activo: true, stock: { not: null }, stockMinimo: { not: null } }, select: { stock: true, stockMinimo: true } }),
    prisma.producto.findMany({ where: { activo: true, stock: { not: null }, stockMinimo: { not: null } }, select: { stock: true, stockMinimo: true } }),
    prisma.factura.findMany({ where: { estado: { not: "anulada" }, creadoEn: { gte: hace30 } }, select: { creadoEn: true, total: true } }),
    prisma.factura.findMany({ orderBy: { creadoEn: "desc" }, take: 5, include: { cliente: true } }),
    prisma.cotizacion.findMany({ orderBy: { creadoEn: "desc" }, take: 5, include: { cliente: true } }),
    prisma.cliente.findMany({ orderBy: { creadoEn: "desc" }, take: 5 }),
    obtenerRentabilidad(inicioMes, hoy),
  ]);

  const ventasMes = facturasMes.reduce((acc, f) => acc + Number(f.total), 0);
  const costoMes = facturasMes.reduce((acc, f) => acc + f.items.reduce((a, i) => a + Number(i.costoTotal ?? 0), 0), 0);
  const beneficioMes = ventasMes - costoMes;

  const ventasMesAnterior = facturasMesAnterior.reduce((acc, f) => acc + Number(f.total), 0);
  const tendenciaVentas = ventasMesAnterior > 0
    ? ((ventasMes - ventasMesAnterior) / ventasMesAnterior) * 100
    : ventasMes > 0 ? 100 : 0;

  const stockBajo =
    recursosConMinimo.filter((r) => Number(r.stock) <= Number(r.stockMinimo)).length +
    productosConMinimo.filter((p) => Number(p.stock) <= Number(p.stockMinimo)).length;

  // 30 casillas continuas (con ceros en los días sin venta) para que el gráfico no tenga huecos.
  const dias = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(hace30);
    d.setDate(d.getDate() + i);
    return { fecha: d.toISOString().slice(0, 10), total: 0 };
  });
  const indexPorFecha = new Map(dias.map((d, i) => [d.fecha, i]));
  for (const f of facturas30d) {
    const idx = indexPorFecha.get(f.creadoEn.toISOString().slice(0, 10));
    if (idx != null) dias[idx].total += Number(f.total);
  }

  const productosPopulares = [...rentabilidad.productos]
    .sort((a, b) => b.ventas.minus(a.ventas).toNumber())
    .slice(0, 5);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-heading text-xl sm:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-1.5">
          Hola, {primerNombre(session.user.name ?? "")} <span aria-hidden>👋</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Así va Aurora Creaciones hoy.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard
          title="Ventas del mes"
          value={fmt(ventasMes)}
          icon={DollarSign}
          variant="info"
          href="/facturas"
          description={
            ventasMesAnterior > 0 || ventasMes > 0
              ? `${tendenciaVentas >= 0 ? "+" : ""}${tendenciaVentas.toFixed(0)}% vs. mes anterior`
              : undefined
          }
        />
        {verCostos && (
          <StatCard title="Beneficio" value={fmt(beneficioMes)} variant={beneficioMes >= 0 ? "success" : "danger"} icon={beneficioMes >= 0 ? TrendingUp : TrendingDown} />
        )}
        <StatCard title="Pedidos pendientes" value={pedidosPendientes} icon={FileText} variant="warning" href="/facturas" />
        <StatCard title="Cotizaciones" value={cotizacionesVigentes} icon={ClipboardList} variant="warning" href="/cotizaciones" />
        <StatCard title="Clientes" value={totalClientes} icon={Users} variant="purple" href="/clientes" />
        <StatCard title="Productos" value={totalProductos} icon={Package} variant="rose" href="/productos" />
        {verCostos && stockBajo > 0 && (
          <StatCard title="Stock bajo" value={stockBajo} icon={AlertTriangle} variant="danger" href="/recursos" />
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border border-border rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-1">Ventas</h2>
          <VentasChart dias={dias} />
        </div>

        <div className="border border-border rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Sparkles size={14} className="text-productos" />
            Productos populares
          </h2>
          {productosPopulares.length === 0 ? (
            <EmptyState title="Sin ventas todavía" description="Los productos más vendidos del mes aparecerán aquí." />
          ) : (
            <ul className="space-y-2.5">
              {productosPopulares.map((p, i) => (
                <li key={p.productoId ?? p.nombre} className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-productos-soft text-productos text-[10px] font-semibold shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 min-w-0 text-sm truncate">{p.nombre}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{p.unidadesVendidas}u</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <div className="border border-border rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Receipt size={14} className="text-ventas" />
            Últimas facturas
          </h2>
          {ultimasFacturas.length === 0 ? (
            <EmptyState title="Sin facturas todavía" description="Cuando factures, las verás listadas aquí." />
          ) : (
            <ul className="space-y-2.5">
              {ultimasFacturas.map((f) => (
                <li key={f.id}>
                  <Link href={`/facturas/${f.id}`} className="flex items-center justify-between gap-2 group">
                    <div className="min-w-0">
                      <p className="text-sm font-medium group-hover:underline truncate">{f.numero}</p>
                      <p className="text-xs text-muted-foreground truncate">{f.cliente?.nombre ?? "Sin cliente"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{fmt(Number(f.total))}</p>
                      <StatusBadge variant={f.estado as BadgeVariant} className="mt-0.5" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-border rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <ClipboardList size={14} className="text-cotizaciones" />
            Últimas cotizaciones
          </h2>
          {ultimasCotizaciones.length === 0 ? (
            <EmptyState title="Sin cotizaciones todavía" description="Las cotizaciones que armes van a aparecer aquí." />
          ) : (
            <ul className="space-y-2.5">
              {ultimasCotizaciones.map((c) => (
                <li key={c.id}>
                  <Link href="/cotizaciones" className="flex items-center justify-between gap-2 group">
                    <div className="min-w-0">
                      <p className="text-sm font-medium group-hover:underline truncate">{c.numero}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.cliente?.nombre ?? "Sin cliente"}</p>
                    </div>
                    <StatusBadge variant={c.estado as BadgeVariant} className="shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-border rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <UserPlus size={14} className="text-clientes" />
            Nuevos clientes
          </h2>
          {ultimosClientes.length === 0 ? (
            <EmptyState title="Sin clientes todavía" description="Los clientes que registres aparecerán aquí." />
          ) : (
            <ul className="space-y-2.5">
              {ultimosClientes.map((c) => (
                <li key={c.id}>
                  <Link href="/clientes" className="flex items-center justify-between gap-2 group">
                    <span className="text-sm font-medium group-hover:underline truncate">{c.nombre}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {c.creadoEn.toLocaleDateString("es-DO", { day: "2-digit", month: "short" })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
