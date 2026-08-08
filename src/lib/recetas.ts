import { prisma } from "@/lib/prisma";

const PROFUNDIDAD_MAXIMA = 3;

/**
 * Valida que agregar `productoComponenteId` como componente de la receta de
 * `productoDuenoId` no cree un ciclo (A contiene B, B contiene A, directa o
 * indirectamente) ni exceda la profundidad máxima de anidación permitida.
 * Lanza si algo de esto pasa; no devuelve nada si todo está bien.
 */
export async function validarSinCiclo(productoDuenoId: string, productoComponenteId: string): Promise<void> {
  if (productoDuenoId === productoComponenteId) {
    throw new Error("Un producto no puede ser componente de su propia receta");
  }

  async function recorrer(id: string, profundidad: number, visitados: Set<string>): Promise<void> {
    if (profundidad > PROFUNDIDAD_MAXIMA) {
      throw new Error(`Los combos no pueden anidarse más de ${PROFUNDIDAD_MAXIMA} niveles`);
    }
    if (visitados.has(id)) {
      throw new Error("Referencia circular detectada en la receta");
    }
    visitados.add(id);

    const receta = await prisma.receta.findUnique({
      where: { productoId: id },
      include: { items: { select: { productoComponenteId: true } } },
    });
    if (!receta) return;

    for (const item of receta.items) {
      if (!item.productoComponenteId) continue;
      if (item.productoComponenteId === productoDuenoId) {
        throw new Error(
          "Este producto ya forma parte (directa o indirectamente) de la receta del componente elegido — crearía un ciclo"
        );
      }
      await recorrer(item.productoComponenteId, profundidad + 1, new Set(visitados));
    }
  }

  await recorrer(productoComponenteId, 1, new Set());
}

/** Exactamente uno de los dos debe estar presente en un RecetaItem. */
export function validarXorRecursoProducto(recursoId?: string | null, productoComponenteId?: string | null): void {
  const tieneRecurso = !!recursoId;
  const tieneProducto = !!productoComponenteId;
  if (tieneRecurso === tieneProducto) {
    throw new Error("Un componente de receta debe referenciar exactamente un recurso O un producto, no ambos ni ninguno");
  }
}
