import { Prisma } from "@/generated/prisma/client";

const { Decimal } = Prisma;
type Decimal = InstanceType<typeof Prisma.Decimal>;
type TransactionClient = Prisma.TransactionClient;

/**
 * Recorre la receta de un producto y acumula cuánto de cada Recurso consume
 * vender `cantidad` unidades — recursivo por sub-productos (combos), mismo
 * patrón de recorrido que calcularCostoProducto en costeo.ts.
 */
async function acumularSalidaRecurso(
  tx: TransactionClient,
  productoId: string,
  cantidad: Decimal,
  acc: Map<string, Decimal>,
  visitados: Set<string> = new Set()
): Promise<void> {
  if (visitados.has(productoId)) return; // ciclo — ya se valida al armar la receta
  visitados.add(productoId);

  const receta = await tx.receta.findUnique({ where: { productoId }, include: { items: true } });
  if (!receta) return;

  for (const item of receta.items) {
    const cantidadEfectiva = item.cantidad.mul(new Decimal(1).plus(item.mermaPct)).mul(cantidad);
    if (item.recursoId) {
      acc.set(item.recursoId, (acc.get(item.recursoId) ?? new Decimal(0)).plus(cantidadEfectiva));
    } else if (item.productoComponenteId) {
      await acumularSalidaRecurso(tx, item.productoComponenteId, cantidadEfectiva, acc, new Set(visitados));
    }
  }
}

export type ItemVendido = { productoId: string | null; cantidad: number };

/**
 * Descuenta stock por una venta y registra cada movimiento (para poder
 * revertirlo exacto si se anula la factura). Producto simple → descuenta su
 * propio stock. Producto compuesto → descuenta el stock de los recursos de
 * su receta (recursivo). Solo toca campos de stock que el usuario ya seteó
 * (null = "sin rastrear"). No bloquea la venta si el stock queda negativo —
 * es una alerta, no un gate, porque este negocio fabrica sobre pedido.
 */
export async function descontarStockPorVenta(
  tx: TransactionClient,
  facturaId: string,
  itemsVendidos: ItemVendido[]
): Promise<void> {
  const idsProductos = itemsVendidos.map((i) => i.productoId).filter((id): id is string => !!id);
  if (idsProductos.length === 0) return;

  const productos = await tx.producto.findMany({ where: { id: { in: idsProductos } } });
  const productoPorId = new Map(productos.map((p) => [p.id, p]));

  for (const item of itemsVendidos) {
    if (!item.productoId) continue;
    const producto = productoPorId.get(item.productoId);
    if (!producto || producto.tipoCosteo !== "simple" || producto.stock == null) continue;

    const cantidad = new Decimal(item.cantidad);
    await tx.producto.update({ where: { id: producto.id }, data: { stock: producto.stock.minus(cantidad) } });
    await tx.movimientoInventario.create({
      data: { facturaId, productoId: producto.id, tipo: "venta", cantidad: cantidad.neg() },
    });
  }

  const consumoRecursos = new Map<string, Decimal>();
  for (const item of itemsVendidos) {
    if (!item.productoId) continue;
    const producto = productoPorId.get(item.productoId);
    if (!producto || producto.tipoCosteo !== "compuesto") continue;
    await acumularSalidaRecurso(tx, item.productoId, new Decimal(item.cantidad), consumoRecursos);
  }

  if (consumoRecursos.size === 0) return;

  const recursos = await tx.recurso.findMany({ where: { id: { in: [...consumoRecursos.keys()] } } });
  for (const recurso of recursos) {
    if (recurso.stock == null) continue;
    const cantidad = consumoRecursos.get(recurso.id)!;
    await tx.recurso.update({ where: { id: recurso.id }, data: { stock: recurso.stock.minus(cantidad) } });
    await tx.movimientoInventario.create({
      data: { facturaId, recursoId: recurso.id, tipo: "venta", cantidad: cantidad.neg() },
    });
  }
}

/**
 * Revierte exactamente los movimientos "venta" de una factura al anularla —
 * lee lo que realmente se descontó (no recalcula con la receta vigente, que
 * pudo cambiar) y lo devuelve al stock. Idempotente: una factura sin
 * movimientos "venta" pendientes de revertir no hace nada.
 */
export async function revertirStockPorAnulacion(tx: TransactionClient, facturaId: string): Promise<void> {
  const movimientos = await tx.movimientoInventario.findMany({ where: { facturaId, tipo: "venta" } });
  if (movimientos.length === 0) return;

  for (const mov of movimientos) {
    if (mov.recursoId) {
      const recurso = await tx.recurso.findUnique({ where: { id: mov.recursoId } });
      if (recurso?.stock != null) {
        await tx.recurso.update({ where: { id: mov.recursoId }, data: { stock: recurso.stock.minus(mov.cantidad) } });
      }
    } else if (mov.productoId) {
      const producto = await tx.producto.findUnique({ where: { id: mov.productoId } });
      if (producto?.stock != null) {
        await tx.producto.update({ where: { id: mov.productoId }, data: { stock: producto.stock.minus(mov.cantidad) } });
      }
    }
    await tx.movimientoInventario.create({
      data: {
        facturaId,
        recursoId: mov.recursoId,
        productoId: mov.productoId,
        tipo: "reversion",
        cantidad: mov.cantidad.neg(),
      },
    });
  }
}
