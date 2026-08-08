import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthRoute } from "@/lib/api-guard";
import { calcularCostoProducto } from "@/lib/costeo";
import { margenDesdePrecio } from "@/lib/margen";
import { descontarStockPorVenta } from "@/lib/inventario";
import { Prisma } from "@/generated/prisma/client";

export const GET = withAuthRoute(async () => {
  const facturas = await prisma.factura.findMany({
    orderBy: { creadoEn: "desc" },
    include: { cliente: true, items: true },
  });
  return NextResponse.json(facturas);
});

type ItemInput = {
  productoId?: string;
  descripcion: string;
  cantidad: number;
  precio: number;
  descuento?: number;
  extraIds?: string[];
};

export const POST = withAuthRoute(async (req, ctx) => {
  const data = await req.json();
  const { clienteId, metodoPago, notas, items } = data as { clienteId?: string; metodoPago?: string; notas?: string; items: ItemInput[] };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "La factura necesita al menos un artículo" }, { status: 400 });
  }

  const count = await prisma.factura.count();
  const numero = `F-${String(count + 1).padStart(5, "0")}`;

  // Snapshot de costo/margen por línea, calculado AHORA — congelado para siempre,
  // los reportes históricos nunca recalculan con costos actuales.
  const itemsConSnapshot = await Promise.all(
    items.map(async (item) => {
      const cantidad = new Prisma.Decimal(item.cantidad);
      const descuento = new Prisma.Decimal(item.descuento ?? 0);

      // Los extras seleccionados se resuelven server-side (nunca se confía en
      // montos que mande el cliente) — solo cuentan los que de verdad
      // pertenecen a este producto y siguen activos.
      let descripcion = item.descripcion;
      let extraPrecioUnitario = new Prisma.Decimal(0);
      let extraCostoUnitario = new Prisma.Decimal(0);
      if (item.productoId && item.extraIds && item.extraIds.length > 0) {
        const extras = await prisma.productoExtra.findMany({
          where: { id: { in: item.extraIds }, productoId: item.productoId, activo: true },
        });
        for (const ex of extras) {
          if (ex.tipo !== "costo") extraPrecioUnitario = extraPrecioUnitario.plus(ex.montoPrecio);
          if (ex.tipo !== "precio") extraCostoUnitario = extraCostoUnitario.plus(ex.montoCosto);
        }
        if (extras.length > 0) descripcion = `${descripcion} + ${extras.map((e) => e.nombre).join(", ")}`;
      }

      const precio = new Prisma.Decimal(item.precio).plus(extraPrecioUnitario);
      const total = precio.mul(cantidad).minus(descuento);

      let costoMateriales: InstanceType<typeof Prisma.Decimal> | null = null;
      let costoManoObra: InstanceType<typeof Prisma.Decimal> | null = null;
      let costoOtros: InstanceType<typeof Prisma.Decimal> | null = null;
      let costoTotal: InstanceType<typeof Prisma.Decimal> | null = null;
      let margenObtenido: InstanceType<typeof Prisma.Decimal> | null = null;

      if (item.productoId) {
        const desglose = await calcularCostoProducto(item.productoId);
        costoMateriales = desglose.materiales.mul(cantidad);
        costoManoObra = desglose.manoObra.mul(cantidad);
        costoOtros = desglose.otros.mul(cantidad).plus(extraCostoUnitario.mul(cantidad));
        costoTotal = costoMateriales.plus(costoManoObra).plus(costoOtros);
        margenObtenido = margenDesdePrecio(costoTotal, total);
      }

      return {
        productoId: item.productoId ?? null,
        descripcion,
        cantidad: item.cantidad,
        precio,
        descuento,
        total,
        costoMateriales,
        costoManoObra,
        costoOtros,
        costoTotal,
        margenObtenido,
      };
    })
  );

  const subtotal = itemsConSnapshot.reduce((acc, i) => acc.plus(i.total), new Prisma.Decimal(0));

  const factura = await prisma.$transaction(async (tx) => {
    const creada = await tx.factura.create({
      data: {
        numero,
        clienteId: clienteId || null,
        usuarioId: ctx.userId,
        metodoPago: metodoPago || null,
        notas: notas || null,
        subtotal,
        total: subtotal,
        items: { create: itemsConSnapshot },
      },
      include: { items: true },
    });

    await descontarStockPorVenta(
      tx,
      creada.id,
      items.map((i) => ({ productoId: i.productoId ?? null, cantidad: i.cantidad }))
    );

    return creada;
  });

  return NextResponse.json(factura, { status: 201 });
});
