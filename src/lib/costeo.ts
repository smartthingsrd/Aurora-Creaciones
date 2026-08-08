import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const { Decimal } = Prisma;
type Decimal = InstanceType<typeof Prisma.Decimal>;

export type DesgloseCosto = {
  materiales: Decimal;
  manoObra: Decimal;
  otros: Decimal;
  total: Decimal;
};

const CERO = new Decimal(0);

/**
 * Calcula el costo de un producto en vivo, recorriendo su receta (recursos +
 * sub-productos anidados). No se guarda nada en DB — así, cuando cambia el
 * costoUnitario de un Recurso, todo producto que lo use refleja el cambio de
 * inmediato sin reescribir filas. `visitados` detecta ciclos (fail-fast).
 */
export async function calcularCostoProducto(
  productoId: string,
  visitados: Set<string> = new Set()
): Promise<DesgloseCosto> {
  if (visitados.has(productoId)) {
    throw new Error(`Ciclo detectado en la receta del producto ${productoId}`);
  }
  visitados.add(productoId);

  const producto = await prisma.producto.findUniqueOrThrow({
    where: { id: productoId },
    include: { receta: { include: { items: { include: { recurso: true } } } } },
  });

  if (producto.tipoCosteo === "simple") {
    const costo = producto.costo ?? CERO;
    return { materiales: costo, manoObra: CERO, otros: CERO, total: costo };
  }

  if (!producto.receta) {
    return { materiales: CERO, manoObra: CERO, otros: CERO, total: CERO };
  }

  let materiales = CERO;
  let manoObra = CERO;
  let otros = CERO;

  for (const item of producto.receta.items) {
    // mermaPct=0.03 → se consume un 3% más de lo que el producto final necesita.
    const cantidadEfectiva = item.cantidad.mul(new Decimal(1).plus(item.mermaPct));

    if (item.recurso) {
      const costoItem = cantidadEfectiva.mul(item.recurso.costoUnitario);
      if (item.recurso.tipo === "material") materiales = materiales.plus(costoItem);
      else if (item.recurso.tipo === "mano_obra") manoObra = manoObra.plus(costoItem);
      else otros = otros.plus(costoItem);
    } else if (item.productoComponenteId) {
      const sub = await calcularCostoProducto(item.productoComponenteId, new Set(visitados));
      materiales = materiales.plus(sub.materiales.mul(cantidadEfectiva));
      manoObra = manoObra.plus(sub.manoObra.mul(cantidadEfectiva));
      otros = otros.plus(sub.otros.mul(cantidadEfectiva));
    }
  }

  const total = materiales.plus(manoObra).plus(otros);
  return { materiales, manoObra, otros, total };
}

/** Cuenta cuántos productos (directos) usan un recurso — para el indicador "usado por N productos". */
export async function contarProductosQueUsanRecurso(recursoId: string): Promise<number> {
  const items = await prisma.recetaItem.findMany({
    where: { recursoId },
    select: { recetaId: true },
    distinct: ["recetaId"],
  });
  return items.length;
}

/** Igual que contarProductosQueUsanRecurso pero para TODOS los recursos a la vez — evita N+1 en listados. */
export async function contarUsoRecursosBatch(): Promise<Map<string, number>> {
  const items = await prisma.recetaItem.findMany({
    where: { recursoId: { not: null } },
    select: { recursoId: true, recetaId: true },
    distinct: ["recursoId", "recetaId"],
  });
  const conteo = new Map<string, number>();
  for (const item of items) {
    if (!item.recursoId) continue;
    conteo.set(item.recursoId, (conteo.get(item.recursoId) ?? 0) + 1);
  }
  return conteo;
}
