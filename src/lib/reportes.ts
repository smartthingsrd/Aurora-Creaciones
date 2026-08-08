import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const { Decimal } = Prisma;
type Decimal = InstanceType<typeof Prisma.Decimal>;

const CERO = new Decimal(0);

export type RentabilidadProducto = {
  productoId: string | null;
  nombre: string;
  unidadesVendidas: number;
  ventas: Decimal;
  costo: Decimal;
  beneficio: Decimal;
  margen: number; // 0-1
};

export type Rentabilidad = {
  productos: RentabilidadProducto[];
  totales: { ventas: Decimal; costo: Decimal; beneficio: Decimal; margen: number };
};

/**
 * Rentabilidad por producto en un período, usando el snapshot de costo/margen
 * congelado en cada ItemFactura al momento de la venta (nunca recalcula con
 * costos actuales — mismo principio que la vista de detalle de factura).
 * Excluye facturas anuladas.
 */
export async function obtenerRentabilidad(desde: Date, hasta: Date): Promise<Rentabilidad> {
  const items = await prisma.itemFactura.findMany({
    where: { factura: { estado: { not: "anulada" }, creadoEn: { gte: desde, lte: hasta } } },
    select: { productoId: true, descripcion: true, cantidad: true, total: true, costoTotal: true },
  });

  const porProducto = new Map<string, RentabilidadProducto>();
  for (const item of items) {
    const clave = item.productoId ?? `libre:${item.descripcion}`;
    const actual = porProducto.get(clave) ?? {
      productoId: item.productoId,
      nombre: item.descripcion,
      unidadesVendidas: 0,
      ventas: CERO,
      costo: CERO,
      beneficio: CERO,
      margen: 0,
    };
    actual.unidadesVendidas += item.cantidad;
    actual.ventas = actual.ventas.plus(item.total);
    actual.costo = actual.costo.plus(item.costoTotal ?? 0);
    porProducto.set(clave, actual);
  }

  const productos = [...porProducto.values()]
    .map((p) => {
      const beneficio = p.ventas.minus(p.costo);
      return { ...p, beneficio, margen: p.ventas.gt(0) ? beneficio.div(p.ventas).toNumber() : 0 };
    })
    .sort((a, b) => b.beneficio.minus(a.beneficio).toNumber());

  const totalesVentas = productos.reduce((acc, p) => acc.plus(p.ventas), CERO);
  const totalesCosto = productos.reduce((acc, p) => acc.plus(p.costo), CERO);
  const totalesBeneficio = totalesVentas.minus(totalesCosto);

  return {
    productos,
    totales: {
      ventas: totalesVentas,
      costo: totalesCosto,
      beneficio: totalesBeneficio,
      margen: totalesVentas.gt(0) ? totalesBeneficio.div(totalesVentas).toNumber() : 0,
    },
  };
}

export type ConsumoRecurso = {
  recursoId: string;
  nombre: string;
  tipo: string;
  unidadMedida: string;
  cantidadConsumida: Decimal;
  costoConsumido: Decimal;
};

/**
 * Acumula, recursivamente, cuánto de cada Recurso consume vender `cantidad`
 * unidades de `productoId` — recorre la receta actual (recursos directos +
 * sub-productos anidados, igual que calcularCostoProducto).
 */
async function acumularConsumoRecurso(
  productoId: string,
  cantidad: Decimal,
  acc: Map<string, Decimal>,
  visitados: Set<string> = new Set()
): Promise<void> {
  if (visitados.has(productoId)) return; // ciclo — ya se valida al armar la receta, no reventar el reporte
  visitados.add(productoId);

  const receta = await prisma.receta.findUnique({
    where: { productoId },
    include: { items: true },
  });
  if (!receta) return;

  for (const item of receta.items) {
    const cantidadEfectiva = item.cantidad.mul(new Decimal(1).plus(item.mermaPct)).mul(cantidad);
    if (item.recursoId) {
      acc.set(item.recursoId, (acc.get(item.recursoId) ?? CERO).plus(cantidadEfectiva));
    } else if (item.productoComponenteId) {
      await acumularConsumoRecurso(item.productoComponenteId, cantidadEfectiva, acc, new Set(visitados));
    }
  }
}

/**
 * Consumo de recursos (materiales, mano de obra, otros) en un período.
 * A diferencia de la rentabilidad, esto NO tiene snapshot histórico por
 * recurso (ItemFactura solo guarda el costo agregado) — se calcula con la
 * receta VIGENTE de cada producto × unidades vendidas en el período. Si una
 * receta cambió después de esas ventas, el número no refleja la versión que
 * realmente se usó entonces.
 */
export async function obtenerConsumoRecursos(desde: Date, hasta: Date): Promise<ConsumoRecurso[]> {
  const items = await prisma.itemFactura.findMany({
    where: {
      productoId: { not: null },
      factura: { estado: { not: "anulada" }, creadoEn: { gte: desde, lte: hasta } },
    },
    select: { productoId: true, cantidad: true },
  });

  const acc = new Map<string, Decimal>();
  for (const item of items) {
    if (!item.productoId) continue;
    await acumularConsumoRecurso(item.productoId, new Decimal(item.cantidad), acc);
  }

  if (acc.size === 0) return [];

  const recursos = await prisma.recurso.findMany({ where: { id: { in: [...acc.keys()] } } });
  return recursos
    .map((r) => {
      const cantidadConsumida = acc.get(r.id) ?? CERO;
      return {
        recursoId: r.id,
        nombre: r.nombre,
        tipo: r.tipo,
        unidadMedida: r.unidadMedida,
        cantidadConsumida,
        costoConsumido: cantidadConsumida.mul(r.costoUnitario),
      };
    })
    .sort((a, b) => b.costoConsumido.minus(a.costoConsumido).toNumber());
}
