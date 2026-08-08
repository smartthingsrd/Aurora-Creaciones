import { Prisma } from "@/generated/prisma/client";

const { Decimal } = Prisma;
type Decimal = InstanceType<typeof Prisma.Decimal>;

/**
 * Margen = beneficio / precio (lo que pediste explícitamente, NO markup).
 * precio = costo / (1 - margen)  —  nunca "costo + X%", eso es markup.
 */
export function precioDesdeMargen(costo: Decimal, margen: Decimal): Decimal {
  const uno = new Decimal(1);
  if (margen.gte(uno)) throw new Error("El margen debe ser menor a 100%");
  return costo.div(uno.minus(margen));
}

export function margenDesdePrecio(costo: Decimal, precio: Decimal): Decimal {
  if (precio.isZero()) return new Decimal(0);
  return precio.minus(costo).div(precio);
}

export function markupDesdePrecio(costo: Decimal, precio: Decimal): Decimal {
  if (costo.isZero()) return new Decimal(0);
  return precio.minus(costo).div(costo);
}

export function beneficioBruto(costo: Decimal, precio: Decimal): Decimal {
  return precio.minus(costo);
}
